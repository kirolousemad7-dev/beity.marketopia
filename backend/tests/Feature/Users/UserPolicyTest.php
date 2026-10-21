<?php

namespace Tests\Feature\Users;

use App\Models\User;
use App\Policies\UserPolicy;
use Database\Factories\Orders\OrderFactory;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UserPolicyTest extends TestCase
{
    use LazilyRefreshDatabase;

    public static function recordAbilities(): array
    {
        return array_map(fn (string $ability): array => [$ability], ['view', 'update', 'delete', 'restore', 'forceDelete']);
    }

    #[DataProvider('recordAbilities')]
    public function test_admin_accounts_are_protected_from_management(string $ability): void
    {
        $actor = User::factory()->admin()->create();
        $record = User::factory()->admin()->create();

        $this->assertFalse($actor->can($ability, $record));
        $this->assertFalse($actor->can($ability, $actor));
    }

    #[DataProvider('recordAbilities')]
    public function test_non_admin_cannot_manage_customers(string $ability): void
    {
        $actor = User::factory()->create();
        $record = User::factory()->create();

        $this->assertFalse($actor->can($ability, $record));
    }

    public function test_admin_can_create_and_manage_regular_users(): void
    {
        $actor = User::factory()->admin()->create();
        $record = User::factory()->create();

        $this->assertTrue($actor->can('viewAny', User::class));
        $this->assertTrue($actor->can('create', User::class));
        $this->assertTrue($actor->can('update', $record));
        $this->assertTrue($actor->can('delete', $record));
        $this->assertFalse($actor->can('restore', $record));
        $this->assertFalse($actor->can('forceDelete', $record));
        $record->delete();
        $this->assertTrue($actor->can('restore', $record));
        $this->assertTrue($actor->can('forceDelete', $record));
        $this->assertFalse($actor->can('update', $record));
    }

    public function test_users_with_orders_cannot_be_permanently_deleted(): void
    {
        $actor = User::factory()->admin()->create();
        $record = User::factory()->create();
        OrderFactory::new()->for($record)->create();
        $record->delete();

        $this->assertFalse($actor->can('forceDelete', $record));
        $this->assertTrue($actor->can('restore', $record));
    }

    public function test_non_admin_and_deleted_admin_cannot_access_user_management(): void
    {
        $customer = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $admin->delete();
        $policy = new UserPolicy;

        $this->assertFalse($policy->viewAny($customer));
        $this->assertFalse($policy->create($customer));
        $this->assertFalse($policy->viewAny($admin));
        $this->assertFalse($policy->create($admin));
        $this->assertFalse($policy->deleteAny($admin));
        $this->assertFalse($policy->restoreAny($admin));
        $this->assertFalse($policy->forceDeleteAny($admin));
    }
}
