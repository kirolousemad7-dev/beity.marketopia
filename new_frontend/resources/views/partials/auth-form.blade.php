<div class="auth-page-wrapper"><div class="auth-page-container"><div class="auth-card">
    <div class="auth-card__header"><h1 class="auth-card__title">{{ $dict['auth'][$page === 'login' ? 'welcome_back' : 'register_title'] }}</h1><p class="auth-card__description">{{ $dict['auth'][$page === 'login' ? 'sign_in_slogan' : 'register_slogan'] }}</p></div>
    <div data-form-status tabindex="-1" hidden></div>
    <form class="auth-form" data-auth-form="{{ $page }}" method="post" action="#" novalidate>
        @csrf
        @if($page === 'register')
        <div class="form-group"><label for="name" class="form-label">{{ $dict['auth']['fullname'] }} *</label><input id="name" name="name" class="form-input" autocomplete="name" required maxlength="255" aria-describedby="name-error"><span id="name-error" class="form-error" data-field-error="name"></span></div>
        @endif
        <div class="form-group"><label for="email" class="form-label">{{ $dict['auth']['email'] }} *</label><input id="email" name="email" type="email" class="form-input" autocomplete="email" required aria-describedby="email-error"><span id="email-error" class="form-error" data-field-error="email"></span></div>
        @foreach($page === 'register' ? ['password', 'password_confirmation'] : ['password'] as $field)
        <div class="form-group"><label for="{{ $field }}" class="form-label">{{ $dict['auth'][$field === 'password' ? 'password' : 'confirm_password'] }} *</label><div class="form-input-wrapper"><input id="{{ $field }}" name="{{ $field }}" type="password" class="form-input form-input--has-action" autocomplete="{{ $page === 'login' ? 'current-password' : 'new-password' }}" required @if($page === 'register') minlength="8" @endif aria-describedby="{{ $field }}-error"><button type="button" class="form-input__toggle-btn" data-password-toggle="{{ $field }}" aria-label="{{ $dict['ui']['show_password'] }}" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></div><span id="{{ $field }}-error" class="form-error" data-field-error="{{ $field }}"></span></div>
        @endforeach
        <button type="submit" class="auth-form__submit-btn">{{ $dict['auth'][$page === 'login' ? 'login' : 'register'] }}</button>
    </form>
    <div class="auth-card__footer"><p class="auth-card__login-prompt">{{ $dict['auth'][$page === 'login' ? 'dont_have_account' : 'registered'] }} <a class="auth-card__login-link" href="{{ url($locale.'/'.($page === 'login' ? 'register' : 'login')) }}">{{ $dict['auth'][$page === 'login' ? 'register' : 'login'] }}</a></p></div>
</div></div></div>
