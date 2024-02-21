import { defineStore } from 'pinia'
import router from '@/router/index.js'
import { useToast } from 'vue-toast-notification'

const BASE_API_URL = import.meta.env.VITE_API_URL

export const useSessionStore = defineStore({
    id: 'session',
    state: () => ({
        loading: false
    }),
    getters: {},
    actions: {
        setToken(newToken) {
            localStorage.setItem('token', newToken)
        },
        getToken() {
            return localStorage.getItem('token') || null
        },
        unsetToken() {
            localStorage.removeItem('token')
        },
        async loginWithGoogle() {
            const response = await fetch(
                `${BASE_API_URL}/api/auth/google/authorize`
            )

            if (response.status === 200) {
                const data = await response.json()
                window.location.href = data.authorization_url
            }
        },
        async getUser(token) {
            const sessionStore = useSessionStore()
            const authToken = token || sessionStore.getToken()
            const url = `${BASE_API_URL}/api/users/me`
            let response = undefined
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`
                    }
                })

                if (response.status === 401) {
                    await router.push('/login')
                }

                return response.json()
            } catch (error) {
                window.location.reload()
            }
        },
        async setPassword(newPassword, token) {
            const response = await fetch(
                `${BASE_API_URL}/api/auth/reset-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        password: newPassword
                    })
                }
            )

            if (response.status === 200) {
                useToast().success('Password updated successfully.')
                window.location.href = '/login'
            } else {
                const data = await response.json()
                useToast().error(
                    'Error updating password: ' + JSON.stringify(data?.detail)
                )
            }
        },
        async loginWithUserPass(email, password) {
            this.loading = true
            try {
                const formData = new FormData()
                formData.set('username', email)
                formData.set('password', password)

                const response = await fetch(
                    `${BASE_API_URL}/api/auth/jwt/login`,
                    {
                        method: 'POST',
                        body: formData
                    }
                )
                this.loading = false

                if (response.status === 200) {
                    const data = await response.json()

                    //GET THE USER & CHECK IF VERIFIED
                    const user = await this.getUser(data.access_token)
                    if (!user.is_verified) {
                        window.location.href = '/verify'
                        return
                    } else {
                        this.setToken(data.access_token)
                        window.location.href = '/library'
                    }

                    return
                } else {
                    const data = await response.json()
                    const detail = data?.detail
                    if (
                        Array.isArray(detail) &&
                        detail.length > 0 &&
                        detail[0].type &&
                        detail[0].type === "missing"
                    ){
                        this.error = "Fields missing"
                    } else {
                        this.error = "Wrong credentials"
                    }

                    useToast().error(
                        'Error logging in: ' + JSON.stringify(this.error)
                    )
                    return
                }
            } catch (error) {
                this.error = error
                useToast().error(
                    'Error logging in: ' + JSON.stringify(this.error)
                )
            } finally {
                this.loading = false
            }
        },
        async verifyToken(token) {
            const response = await fetch(`${BASE_API_URL}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token
                })
            })

            return response
        },
        async requestVerifyToken(email) {
            const response = await fetch(
                `${BASE_API_URL}/api/auth/request-verify-token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email
                    })
                }
            )
        },
        async requestResetPassword(email) {
            const response = await fetch(
                `${BASE_API_URL}/api/auth/forgot-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email
                    })
                }
            )

            if (response.status === 202) {
                useToast().success('Check your email to reset your password.')
            }
        },
        async registerUser(email, password, inviteCode) {
            this.loading = true
            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/auth/register?invite_code=${inviteCode}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                )
                this.loading = false

                if (response.status === 201) {
                    await this.requestVerifyToken(email)
                    window.location.href = '/verify'
                    return
                } else {
                    try {
                        const data = await response.json()
                        this.error = data?.detail
                    } catch (error) {
                        console.error(error)
                    }

                    useToast().error(
                        'Error registering user: ' + JSON.stringify(this.error)
                    )
                    return
                }
            } catch (error) {
                this.error = error
                useToast().error(
                    'ERROR running project: ' + JSON.stringify(this.error)
                )
            } finally {
                this.loading = false
            }
        }
    }
})
