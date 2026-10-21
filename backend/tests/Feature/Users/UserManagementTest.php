<?php

namespace Tests\Feature\Users;

use App\Filament\Resources\Users\Pages\CreateUser;
use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\User;
use App\Models\Users\UserAuditLog;
use App\Services\Users\ManageUsers;
use Database\Factories\Orders\OrderFactory;
use Filament\Actions\Testing\TestAction;
use Filament\Facades\Filament;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function signInAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        Filament::setCurrentPanel(Filament::getPanel('admin'));

        return $admin;
    }

    public function test_list_search_and_deleted_filter_never_show_admins(): void
    {
        $this->signInAdmin();
        $customer = User::factory()->create(['name' => 'Visible Customer']);
        $other = User::factory()->create();
        $deleted = User::factory()->trashed()->create();
        $admin = User::factory()->admin()->create(['name' => 'Visible Admin']);
        $deletedAdmin = User::factory()->admin()->trashed()->create();

        Livewire::test(ListUsers::class)
            ->assertCanSeeTableRecords([$customer, $other])
            ->assertCanNotSeeTableRecords([$admin, $deleted, $deletedAdmin])
            ->searchTable('Visible')->assertCanSeeTableRecords([$customer])
            ->assertCanNotSeeTableRecords([$other, $admin]);
        Livewire::test(ListUsers::class)->filterTable('trashed', true)
            ->assertCanSeeTableRecords([$deleted])
            ->assertCanNotSeeTableRecords([$admin, $deletedAdmin]);
    }

    public function test_direct_admin_edit_links_are_not_found_and_customers_are_forbidden(): void
    {
        $admin = $this->signInAdmin();
        $customer = User::factory()->create();
        $this->get('/admin/users/'.$admin->id.'/edit')->assertNotFound();
        $this->actingAs($customer)->get('/admin/users')->assertForbidden();
    }

    public function test_create_flow_hashes_password_and_audits_the_admin(): void
    {
        $admin = $this->signInAdmin();
        Livewire::test(CreateUser::class)->fillForm([
            'name' => 'New Customer', 'email' => 'new@example.test',
            'password' => 'NewPassword123', 'password_confirmation' => 'NewPassword123',
        ])->call('create')->assertHasNoFormErrors();

        $record = User::where('email', 'new@example.test')->sole();
        $this->assertFalse($record->is_admin);
        $this->assertTrue(Hash::check('NewPassword123', $record->password));
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.created', 'user_id' => (string) $admin->id]);
        $this->assertStringNotContainsString('NewPassword123', UserAuditLog::sole()->getRawOriginal('details'));
    }

    public function test_edit_flow_keeps_blank_password_and_clears_verification_after_email_change(): void
    {
        $this->signInAdmin();
        $record = User::factory()->create();
        $oldHash = $record->password;
        Livewire::test(EditUser::class, ['record' => $record->id])->fillForm([
            'name' => 'Updated Customer', 'email' => 'updated@example.test',
            'password' => '', 'password_confirmation' => '',
        ])->call('save')->assertHasNoFormErrors();

        $record->refresh();
        $this->assertSame('Updated Customer', $record->name);
        $this->assertSame($oldHash, $record->password);
        $this->assertNull($record->email_verified_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.updated']);
    }

    public function test_password_update_revokes_existing_tokens_and_ignores_role_tampering(): void
    {
        $admin = $this->signInAdmin();
        $record = User::factory()->create();
        $record->createToken('old-session');
        app(ManageUsers::class)->update($admin, $record, [
            'name' => $record->name, 'email' => $record->email, 'is_admin' => true,
            'password' => 'ChangedPassword123', 'password_confirmation' => 'ChangedPassword123',
        ]);

        $this->assertFalse($record->fresh()->is_admin);
        $this->assertTrue(Hash::check('ChangedPassword123', $record->fresh()->password));
        $this->assertSame(0, $record->tokens()->count());
    }

    public function test_delete_and_restore_actions_keep_orders_and_block_api_access_until_restored(): void
    {
        $admin = $this->signInAdmin();
        $record = User::factory()->create();
        $order = OrderFactory::new()->for($record)->create();
        $token = $record->createToken('customer-session')->plainTextToken;
        Livewire::test(ListUsers::class)->callAction(TestAction::make('delete')->table($record));
        $this->assertSoftDeleted($record);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertSame($record->id, $order->fresh()->user->id);
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/profile')->assertUnauthorized();
        $this->actingAs($admin);
        Livewire::test(ListUsers::class)->filterTable('trashed', true)
            ->callAction(TestAction::make('restore')->table($record));
        $this->assertNotSoftDeleted($record);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.delete']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.restore']);
    }

    public function test_force_delete_action_removes_only_deleted_users_without_orders(): void
    {
        $this->signInAdmin();
        $record = User::factory()->trashed()->create();
        Livewire::test(ListUsers::class)->filterTable('trashed', true)
            ->callAction(TestAction::make('forceDelete')->table($record));

        $this->assertDatabaseMissing('users', ['id' => $record->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.forceDelete']);
    }

    public function test_service_refuses_to_edit_an_admin_account(): void
    {
        $actor = $this->signInAdmin();
        $target = User::factory()->admin()->create();
        $this->expectException(AuthorizationException::class);
        app(ManageUsers::class)->update($actor, $target, ['name' => 'Tampered', 'email' => $target->email]);
    }

    public static function invalidInput(): array
    {
        return [
            'missing name' => ['name', ''], 'invalid email' => ['email', 'not-an-email'],
            'short password' => ['password', 'short'], 'mismatched confirmation' => ['password_confirmation', 'different'],
        ];
    }

    #[DataProvider('invalidInput')]
    public function test_create_form_rejects_invalid_input(string $field, string $value): void
    {
        $this->signInAdmin();
        $data = ['name' => 'Customer', 'email' => 'customer@example.test', 'password' => 'Password123', 'password_confirmation' => 'Password123'];
        $data[$field] = $value;
        Livewire::test(CreateUser::class)->fillForm($data)->call('create')->assertHasFormErrors();
        $this->assertSame(0, User::where('is_admin', false)->count());
    }

    public function test_deleted_user_email_is_reserved_for_restoration(): void
    {
        $admin = $this->signInAdmin();
        $record = User::factory()->trashed()->create();
        $this->expectException(ValidationException::class);
        app(ManageUsers::class)->create($admin, [
            'name' => 'Replacement', 'email' => $record->email,
            'password' => 'Password123', 'password_confirmation' => 'Password123',
        ]);
    }
}
