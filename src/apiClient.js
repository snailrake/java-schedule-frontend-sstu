import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function getAuthHeader() {
    const token = localStorage.getItem('accessToken');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

async function tryRefreshToken() {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return false;
    }

    try {
        const res = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefresh })
        });

        if (!res.ok) {
            throw new Error(`Ошибка ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Ошибка обновления сессии',
            text: 'Срок действия токена истёк. Пожалуйста, войдите снова.',
            background: '#1f1f1f',
            color: '#ffffff',
            confirmButtonColor: '#4f46e5'
        }).then(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        });
        return false;
    }
}

export async function authFetch(url, options = {}) {
    const baseHeaders = getAuthHeader();
    const mergedHeaders = options.headers ? { ...options.headers, ...baseHeaders } : { ...baseHeaders };

    let response;
    try {
        response = await fetch(url, { ...options, headers: mergedHeaders });
    } catch (networkErr) {
        Swal.fire({
            icon: 'error',
            title: 'Ошибка сети',
            text: networkErr.message,
            background: '#1f1f1f',
            color: '#ffffff',
            confirmButtonColor: '#4f46e5'
        });
        throw networkErr;
    }

    if (response.status === 401) {
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
            throw new Error('Не удалось обновить accessToken');
        }

        const newAuthHeader = getAuthHeader();
        const retryHeaders = options.headers ? { ...options.headers, ...newAuthHeader } : { ...newAuthHeader };

        try {
            response = await fetch(url, { ...options, headers: retryHeaders });
        } catch (networkErr2) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка сети',
                text: networkErr2.message,
                background: '#1f1f1f',
                color: '#ffffff',
                confirmButtonColor: '#4f46e5'
            });
            throw networkErr2;
        }
    }

    if (!response.ok) {
        let errorText = `Ошибка ${response.status}: ${response.statusText}`;
        try {
            const errBody = await response.json();
            if (errBody && errBody.message) {
                errorText = errBody.message;
            }
        } catch (_) {}

        Swal.fire({
            icon: 'error',
            title: 'Ошибка запроса',
            text: errorText,
            background: '#1f1f1f',
            color: '#ffffff',
            confirmButtonColor: '#4f46e5'
        });

        const error = new Error(errorText);
        error.status = response.status;
        throw error;
    }

    return response;
}
