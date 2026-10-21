<?php

namespace App\Policies;

use App\Enums\BostaSubmissionStatus;
use App\Models\Orders\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_admin && ! $user->trashed();
    }

    public function view(User $user, Order $order): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Order $order): bool
    {
        return $this->viewAny($user) && $order->bosta_submission_status === null;
    }

    public function delete(User $user, Order $order): bool
    {
        return $this->update($user, $order);
    }

    public function accept(User $user, Order $order): bool
    {
        return $this->viewAny($user) && $order->status === 'pending' && $order->bosta_submission_status === null;
    }

    public function retryBosta(User $user, Order $order): bool
    {
        return $this->viewAny($user) && $order->status === 'processing'
            && $order->bosta_submission_status === BostaSubmissionStatus::Failed && blank($order->bosta_delivery_id);
    }
}
