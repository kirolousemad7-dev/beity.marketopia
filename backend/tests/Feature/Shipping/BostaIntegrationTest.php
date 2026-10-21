<?php

namespace Tests\Feature\Shipping;

use App\Enums\BostaSubmissionStatus;
use App\Exceptions\Shipping\BostaException;
use App\Filament\Resources\Orders\Pages\ListOrders;
use App\Jobs\Shipping\SendOrderToBosta;
use App\Models\Orders\Order;
use App\Models\User;
use App\Services\Orders\AcceptOrder;
use App\Services\Shipping\BostaService;
use Database\Factories\Orders\OrderFactory;
use Database\Factories\Products\ProductFactory;
use Filament\Actions\Testing\TestAction;
use Filament\Facades\Filament;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BostaIntegrationTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.bosta.api_key' => 'test-key', 'services.bosta.base_url' => 'https://bosta.example/api/v2',
            'services.bosta.queue_connection' => 'database', 'services.bosta.queue' => 'shipping']);
        Http::preventStrayRequests();
    }

    private function locations(): void
    {
        Http::fake([
            'https://bosta.example/api/v2/pickup-locations' => Http::response(['success' => true, 'data' => ['list' => [
                ['_id' => 'warehouse-one', 'locationName' => 'Main warehouse'],
                ['_id' => 'warehouse-two', 'locationName' => 'Second warehouse'],
            ]]]),
            'https://bosta.example/api/v2/cities' => Http::response(['success' => true, 'data' => ['list' => [
                ['_id' => 'cairo', 'name' => 'Cairo', 'nameAr' => 'القاهرة', 'dropOffAvailability' => true],
                ['_id' => 'unavailable', 'name' => 'Unavailable', 'dropOffAvailability' => false],
            ]]]),
            'https://bosta.example/api/v2/cities/cairo/districts' => Http::response(['success' => true, 'data' => [
                ['districtId' => 'maadi', 'districtName' => 'Maadi', 'districtOtherName' => 'المعادي', 'zoneId' => 'zone-maadi', 'dropOffAvailability' => true],
                ['districtId' => 'blocked', 'districtName' => 'Blocked', 'zoneId' => 'zone-maadi', 'dropOffAvailability' => false],
            ]]),
        ]);
    }

    private function order(string $method = 'cash_on_delivery'): Order
    {
        $order = OrderFactory::new()->withCustomerInformation()->create();
        $order->transaction()->create(['amount' => 210, 'payment_method' => $method, 'status' => 'pending']);
        $order->items()->create(['product_id' => ProductFactory::new()->create()->id, 'quantity' => 2, 'price' => 100]);

        return $order;
    }

    private function data(): array
    {
        return ['pickup_location_id' => 'warehouse-one', 'city_id' => 'cairo', 'district_id' => 'maadi', 'shipping_address' => '12 Street, Maadi',
            'customer_name' => 'Ahmed Ali', 'customer_phone' => '+20 1012345678', 'additional_phone' => '01098765432'];
    }

    public function test_filament_acceptance_saves_address_and_queues_without_creating_delivery(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $order = $this->order();
        $this->locations();
        Queue::fake([SendOrderToBosta::class]);

        Livewire::test(ListOrders::class)->callAction(TestAction::make('accept_order')->table($order), $this->data())
            ->assertHasNoActionErrors()->assertNotified(__('Order accepted and queued for Bosta'));

        $order->refresh();
        $this->assertSame('processing', $order->status);
        $this->assertSame(BostaSubmissionStatus::Queued, $order->bosta_submission_status);
        $this->assertSame('maadi', $order->bosta_address['districtId']);
        $this->assertSame('warehouse-one', $order->bosta_pickup_location_id);
        $this->assertSame('Main warehouse', $order->bosta_pickup_location_name);
        $this->assertSame('pending', $order->transaction->status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'order.accepted', 'user_id' => (string) $admin->id]);
        Queue::assertPushed(SendOrderToBosta::class, fn ($job): bool => $job->orderId === $order->id && $job->queue === 'shipping' && $job->connection === 'database');
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST');
    }

    public function test_real_database_queue_is_used_even_with_sync_default(): void
    {
        $this->locations();
        $order = $this->order();
        app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
        $this->assertDatabaseHas('jobs', ['queue' => 'shipping']);
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST');
    }

    #[DataProvider('paymentMethods')]
    public function test_submission_sends_correct_cash_amount_and_stores_confirmation(string $method, int $cod, string $paymentStatus): void
    {
        $order = $this->order($method);
        $this->locations();
        Queue::fake([SendOrderToBosta::class]);
        app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
        Http::fake(['https://bosta.example/api/v2/deliveries?apiVersion=1' => Http::response([
            'success' => true, 'data' => ['_id' => 'shipment-id', 'trackingNumber' => '5108002'],
        ])]);
        $job = new SendOrderToBosta($order->id);
        $job->handle(app(BostaService::class));
        $job->handle(app(BostaService::class));

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && $request->hasHeader('Authorization', 'test-key') && $request['type'] === 10
            && $request['businessLocationId'] === 'warehouse-one' && (float) $request['cod'] === (float) $cod && $request['uniqueBusinessReference'] === $order->order_number
            && $request['receiver']['firstName'] === 'Ahmed' && $request['receiver']['lastName'] === 'Ali'
            && $request['receiver']['phone'] === '01012345678' && $request['receiver']['secondPhone'] === '01098765432'
            && $request['dropOffAddress']['city'] === 'Cairo' && $request['dropOffAddress']['districtId'] === 'maadi'
            && $request['specs']['packageDetails']['itemsCount'] === 2);
        $this->assertSame(1, Http::recorded(fn (Request $request): bool => $request->method() === 'POST')->count());
        $order->refresh();
        $this->assertSame(BostaSubmissionStatus::Submitted, $order->bosta_submission_status);
        $this->assertSame('shipment-id', $order->bosta_delivery_id);
        $this->assertSame('5108002', $order->bosta_tracking_number);
        $this->assertNotNull($order->bosta_submitted_at);
        $this->assertSame('processing', $order->status);
        $this->assertSame($paymentStatus, $order->transaction->status);
    }

    public static function paymentMethods(): array
    {
        return ['cash' => ['cash_on_delivery', 210, 'pending'], 'wallet' => ['wallet', 0, 'completed'], 'instapay' => ['instapay', 0, 'completed']];
    }

    #[DataProvider('failureResponses')]
    public function test_api_failures_are_recorded_without_reposting(int $status, array $body, BostaSubmissionStatus $expected): void
    {
        $order = $this->queuedOrder();
        Http::fake(['https://bosta.example/api/v2/deliveries?apiVersion=1' => Http::response($body, $status)]);
        $job = new SendOrderToBosta($order->id);
        try {
            $job->handle(app(BostaService::class));
            $this->fail('Expected Bosta failure.');
        } catch (BostaException $exception) {
            $job->failed($exception);
        }
        $job->handle(app(BostaService::class));
        $this->assertSame($expected, $order->refresh()->bosta_submission_status);
        $this->assertNotNull($order->bosta_error);
        $this->assertStringNotContainsString('private response', $order->bosta_error);
        Http::assertSentCount(1);
    }

    public static function failureResponses(): array
    {
        return [
            'validation' => [400, ['success' => false, 'errorCode' => 3003, 'message' => 'private response'], BostaSubmissionStatus::Failed],
            'credentials' => [401, [], BostaSubmissionStatus::Failed],
            'rate limit' => [429, [], BostaSubmissionStatus::Failed],
            'business rejection' => [200, ['success' => false], BostaSubmissionStatus::Failed],
            'server failure' => [500, [], BostaSubmissionStatus::NeedsReview],
            'conflict' => [409, [], BostaSubmissionStatus::NeedsReview],
            'timeout response' => [408, [], BostaSubmissionStatus::NeedsReview],
            'missing success flag' => [200, [], BostaSubmissionStatus::NeedsReview],
            'invalid success flag' => [200, ['success' => 'true'], BostaSubmissionStatus::NeedsReview],
            'malformed confirmation' => [200, ['success' => true, 'data' => []], BostaSubmissionStatus::NeedsReview],
        ];
    }

    public function test_connection_failure_requires_review_and_is_not_retryable(): void
    {
        $order = $this->queuedOrder();
        Http::fake(['https://bosta.example/api/v2/deliveries?apiVersion=1' => Http::failedConnection()]);
        try {
            (new SendOrderToBosta($order->id))->handle(app(BostaService::class));
            $this->fail('Expected connection failure.');
        } catch (BostaException) {
            $this->assertSame(BostaSubmissionStatus::NeedsReview, $order->refresh()->bosta_submission_status);
            $this->assertFalse(Gate::forUser(User::factory()->admin()->create())->allows('retryBosta', $order));
        }
        Http::assertSentCount(1);
    }

    public function test_rejected_shipment_can_be_corrected_and_requeued(): void
    {
        $order = $this->queuedOrder();
        $order->forceFill(['bosta_submission_status' => BostaSubmissionStatus::Failed, 'bosta_error' => 'Rejected'])->save();
        $this->locations();
        Queue::fake([SendOrderToBosta::class]);
        $admin = User::factory()->admin()->create();
        app(AcceptOrder::class)->handle($admin, $order, $this->data(), retry: true);
        $this->assertSame(BostaSubmissionStatus::Queued, $order->refresh()->bosta_submission_status);
        $this->assertNull($order->bosta_error);
        $this->assertDatabaseHas('audit_logs', ['action' => 'order.bosta_requeued', 'user_id' => (string) $admin->id]);
        Queue::assertPushed(SendOrderToBosta::class, 1);
    }

    public function test_worker_interruption_marks_submission_for_review(): void
    {
        $order = $this->queuedOrder();
        $order->forceFill(['bosta_submission_status' => BostaSubmissionStatus::Submitting])->save();
        (new SendOrderToBosta($order->id))->failed(new \RuntimeException('Private details'));
        $this->assertSame(BostaSubmissionStatus::NeedsReview, $order->refresh()->bosta_submission_status);
        $this->assertStringNotContainsString('Private details', $order->bosta_error);
        Http::assertNothingSent();
    }

    public function test_cancelled_orders_are_not_sent(): void
    {
        $order = $this->queuedOrder();
        $order->update(['status' => 'cancelled']);
        (new SendOrderToBosta($order->id))->handle(app(BostaService::class));
        Http::assertNothingSent();
    }

    #[DataProvider('invalidLocations')]
    public function test_invalid_locations_are_refused_without_acceptance(string $field, string $value): void
    {
        $order = $this->order();
        $this->locations();
        Queue::fake();
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, array_replace($this->data(), [$field => $value]));
            $this->fail('Expected invalid location.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey($field, $exception->errors());
        }
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
    }

    public static function invalidLocations(): array
    {
        return ['unknown pickup location' => ['pickup_location_id', 'another-business-location'], 'unknown city' => ['city_id', 'missing'], 'disabled city' => ['city_id', 'unavailable'],
            'district from another city' => ['district_id', 'other-city'], 'disabled district' => ['district_id', 'blocked']];
    }

    public function test_customer_cannot_accept_and_repeated_acceptance_is_denied(): void
    {
        $order = $this->order();
        $this->assertFalse(Gate::forUser(User::factory()->create())->allows('accept', $order));
        $this->locations();
        Queue::fake([SendOrderToBosta::class]);
        $admin = User::factory()->admin()->create();
        app(AcceptOrder::class)->handle($admin, $order, $this->data());
        $this->expectException(AuthorizationException::class);
        app(AcceptOrder::class)->handle($admin, $order->fresh(), $this->data());
    }

    public function test_locations_are_cached_and_non_deliverable_locations_are_excluded(): void
    {
        $this->locations();
        $service = app(BostaService::class);
        $this->assertSame(['cairo'], array_keys($service->cities()));
        $this->assertSame(['maadi'], array_keys($service->districts('cairo')));
        $service->cities();
        $service->districts('cairo');
        Http::assertSentCount(2);
    }

    #[DataProvider('invalidAcceptanceData')]
    public function test_invalid_customer_data_does_not_queue(string $field, mixed $value): void
    {
        $order = $this->order();
        Queue::fake();
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, array_replace($this->data(), [$field => $value]));
            $this->fail('Expected validation failure.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey($field, $exception->errors());
        }
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
        Http::assertNothingSent();
    }

    public static function invalidAcceptanceData(): array
    {
        return ['pickup required' => ['pickup_location_id', ''], 'pickup ID too long' => ['pickup_location_id', str_repeat('a', 101)], 'city required' => ['city_id', ''], 'district required' => ['district_id', ''],
            'name required' => ['customer_name', '   '], 'name too long' => ['customer_name', str_repeat('a', 101)],
            'phone required' => ['customer_phone', ''], 'phone invalid' => ['customer_phone', 'abc'],
            'additional phone invalid' => ['additional_phone', 'abc'],
            'short address' => ['shipping_address', '12345'], 'padded short address' => ['shipping_address', '   12345   '],
            'address too long' => ['shipping_address', str_repeat('a', 256)]];
    }

    #[DataProvider('invalidConfiguration')]
    public function test_missing_credentials_or_unsafe_queue_prevents_acceptance(string $key, mixed $value): void
    {
        $order = $this->order();
        config([$key => $value]);
        Queue::fake();
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
            $this->fail('Expected configuration failure.');
        } catch (BostaException) {
            $this->assertSame('pending', $order->refresh()->status);
        }
        Queue::assertNothingPushed();
        Http::assertNothingSent();
    }

    public static function invalidConfiguration(): array
    {
        return ['missing key' => ['services.bosta.api_key', ''],
            'sync queue' => ['services.bosta.queue_connection', 'sync'],
            'different database' => ['queue.connections.database.connection', 'another_database']];
    }

    public function test_metadata_failure_leaves_order_pending_and_shows_notification(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $order = $this->order();
        Http::fake([
            'https://bosta.example/api/v2/pickup-locations' => Http::response(['success' => true, 'data' => ['list' => [
                ['_id' => 'warehouse-one', 'locationName' => 'Main warehouse'],
            ]]]),
            'https://bosta.example/api/v2/cities' => Http::response(['success' => false], 503),
        ]);
        Queue::fake();
        Livewire::test(ListOrders::class)->mountAction(TestAction::make('accept_order')->table($order))
            ->assertNotified(__('Bosta locations are unavailable. Please try again.'));
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
    }

    public function test_customer_cannot_access_order_management(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin/orders')->assertForbidden();
    }

    public function test_deleted_administrators_and_non_pending_orders_cannot_be_accepted(): void
    {
        $order = $this->order();
        $deleted = User::factory()->admin()->trashed()->create();
        $this->assertFalse(Gate::forUser($deleted)->allows('accept', $order));
        $order->update(['status' => 'cancelled']);
        $this->assertFalse(Gate::forUser(User::factory()->admin()->create())->allows('accept', $order));
    }

    public function test_filament_retry_is_hidden_for_uncertain_shipments(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $order = $this->queuedOrder();
        $order->forceFill(['bosta_submission_status' => BostaSubmissionStatus::NeedsReview])->save();
        Livewire::test(ListOrders::class)->assertActionHidden(TestAction::make('retry_bosta')->table($order));
        $this->assertFalse(Gate::forUser($admin)->allows('update', $order));
        $this->assertFalse(Gate::forUser($admin)->allows('delete', $order));
    }

    public function test_enqueue_failure_rolls_back_acceptance_and_audit(): void
    {
        $this->locations();
        $order = $this->order();
        config(['queue.connections.database.table' => 'missing_queue_table']);
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
            $this->fail('Expected enqueue failure.');
        } catch (QueryException) {
            $this->assertSame('pending', $order->refresh()->status);
            $this->assertNull($order->bosta_submission_status);
            $this->assertDatabaseMissing('audit_logs', ['action' => 'order.accepted']);
        }
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'POST');
    }

    public function test_filament_retry_queues_corrected_rejected_shipment(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $order = $this->queuedOrder();
        $order->forceFill(['bosta_submission_status' => BostaSubmissionStatus::Failed])->save();
        $this->locations();
        Queue::fake([SendOrderToBosta::class]);
        Livewire::test(ListOrders::class)->callAction(TestAction::make('retry_bosta')->table($order), $this->data())
            ->assertHasNoActionErrors()->assertNotified(__('Order accepted and queued for Bosta'));
        $this->assertSame(BostaSubmissionStatus::Queued, $order->refresh()->bosta_submission_status);
        Queue::assertPushed(SendOrderToBosta::class, 1);
    }

    #[DataProvider('unshippableOrders')]
    public function test_unshippable_order_is_not_accepted(string $condition): void
    {
        $order = $this->order();
        match ($condition) {
            'no payment' => $order->transaction()->delete(),
            'no items' => $order->items()->delete(),
            'zero total' => $order->update(['total_amount' => 0]),
            'over COD limit' => $order->update(['total_amount' => 30000.01]),
        };
        $this->locations();
        Queue::fake();
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
            $this->fail('Expected invalid order.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('city_id', $exception->errors());
        }
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
    }

    public static function unshippableOrders(): array
    {
        return ['no payment' => ['no payment'], 'no items' => ['no items'], 'zero total' => ['zero total'], 'over COD limit' => ['over COD limit']];
    }

    public function test_database_worker_creates_shipment_and_removes_completed_job(): void
    {
        $this->locations();
        $order = $this->order();
        app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
        Http::fake(['https://bosta.example/api/v2/deliveries?apiVersion=1' => Http::response([
            'success' => true, 'data' => ['_id' => 'worker-shipment', 'trackingNumber' => '12345'],
        ])]);
        $this->artisan('queue:work', ['connection' => 'database', '--queue' => 'shipping', '--once' => true, '--tries' => 1])->assertExitCode(0);
        $this->assertSame('worker-shipment', $order->refresh()->bosta_delivery_id);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertSame(1, Http::recorded(fn (Request $request): bool => $request->method() === 'POST')->count());
    }

    public function test_job_failure_before_submission_is_retryable(): void
    {
        $order = $this->queuedOrder();
        (new SendOrderToBosta($order->id))->failed(new \RuntimeException('Private details'));
        $this->assertSame(BostaSubmissionStatus::Failed, $order->refresh()->bosta_submission_status);
        $this->assertTrue(Gate::forUser(User::factory()->admin()->create())->allows('retryBosta', $order));
        Http::assertNothingSent();
    }

    public function test_filament_requires_pickup_selection_before_acceptance(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $order = $this->order();
        $this->locations();
        Queue::fake();
        $data = $this->data();
        unset($data['pickup_location_id']);
        Livewire::test(ListOrders::class)->callAction(TestAction::make('accept_order')->table($order), $data)
            ->assertHasActionErrors(['pickup_location_id' => 'required']);
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
    }

    public function test_pickup_choice_is_saved_and_overrides_environment_fallback(): void
    {
        $this->locations();
        $order = $this->order();
        Queue::fake([SendOrderToBosta::class]);
        app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order,
            array_replace($this->data(), ['pickup_location_id' => 'warehouse-two']));
        Http::fake(['https://bosta.example/api/v2/deliveries?apiVersion=1' => Http::response([
            'success' => true, 'data' => ['_id' => 'pickup-test', 'trackingNumber' => '12345'],
        ])]);
        (new SendOrderToBosta($order->id))->handle(app(BostaService::class));
        $this->assertSame('warehouse-two', $order->refresh()->bosta_pickup_location_id);
        $this->assertSame('Second warehouse', $order->bosta_pickup_location_name);
        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST' && $request['businessLocationId'] === 'warehouse-two');
        Queue::assertPushed(SendOrderToBosta::class, 1);
    }

    public function test_pickup_lookup_uses_api_key_and_caches_only_location_choices(): void
    {
        $this->locations();
        $service = app(BostaService::class);
        $this->assertSame(['warehouse-one' => ['_id' => 'warehouse-one', 'locationName' => 'Main warehouse'],
            'warehouse-two' => ['_id' => 'warehouse-two', 'locationName' => 'Second warehouse']], $service->pickupLocations());
        $service->pickupLocations();
        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://bosta.example/api/v2/pickup-locations'
            && $request->hasHeader('Authorization', 'test-key'));
    }

    public function test_retry_dialog_retains_saved_pickup_location(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $this->locations();
        $order = $this->queuedOrder();
        $order->forceFill(['bosta_submission_status' => BostaSubmissionStatus::Failed,
            'bosta_pickup_location_id' => 'warehouse-two', 'bosta_pickup_location_name' => 'Second warehouse'])->save();
        Livewire::test(ListOrders::class)->mountAction(TestAction::make('retry_bosta')->table($order))
            ->assertActionDataSet(['pickup_location_id' => 'warehouse-two']);
    }

    public function test_pickup_lookup_failure_does_not_accept_or_queue_order(): void
    {
        $order = $this->order();
        Http::fake(['https://bosta.example/api/v2/pickup-locations' => Http::response(['success' => false], 503)]);
        Queue::fake();
        try {
            app(AcceptOrder::class)->handle(User::factory()->admin()->create(), $order, $this->data());
            $this->fail('Expected pickup lookup failure.');
        } catch (BostaException $exception) {
            $this->assertSame('Bosta pickup locations are unavailable. Please try again.', $exception->getMessage());
        }
        $this->assertSame('pending', $order->refresh()->status);
        Queue::assertNothingPushed();
    }

    private function queuedOrder(): Order
    {
        $order = $this->order();
        $order->forceFill(['status' => 'processing', 'bosta_submission_status' => BostaSubmissionStatus::Queued,
            'bosta_address' => ['city' => 'Cairo', 'cityId' => 'cairo', 'districtId' => 'maadi', 'zoneId' => 'zone-maadi', 'firstLine' => '12 Street, Maadi']])->save();

        return $order;
    }
}
