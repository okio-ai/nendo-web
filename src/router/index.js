import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session.js'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../views/HomeView.vue')
        },
        {
            path: '/library',
            name: 'library',
            component: () => import('../views/LibraryView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/library/:id',
            name: 'track',
            component: () => import('../views/LibraryView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/collection/:id',
            name: 'collection',
            component: () => import('../views/LibraryView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/artist/:id',
            name: 'artist',
            component: () => import('../views/LibraryView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/album/:id',
            name: 'album',
            component: () => import('../views/LibraryView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/SigninView.vue')
        },
        {
            path: '/join',
            name: 'join',
            component: () => import('../views/SignupView.vue')
        },
        {
            path: '/verify',
            name: 'verify',
            component: () => import('../views/EmailVerifyView.vue')
        },
        {
            path: '/verified/:token',
            name: 'verified',
            component: () => import('../views/EmailVerifySuccessView.vue')
        },
        {
            path: '/setpassword/:token',
            name: 'setpassword',
            component: () => import('../views/PasswordSetView.vue'),
            meta: {
                requiresAuth: false
            }
        },
        {
            path: '/forgot',
            name: 'forgot',
            component: () => import('../views/PasswordResetView.vue')
        },
        {
            path: '/action',
            name: 'action',
            component: () => import('../views/ActionView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/user',
            name: 'user',
            component: () => import('../views/UserView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/callback',
            name: 'callback',
            component: () => import('../views/OAuthCallback.vue')
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const BASE_API_URL = import.meta.env.VITE_API_URL
    const sessionStore = useSessionStore()
    // If the route is configured to check for authentication, handle it here.
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!sessionStore.getToken()) {
            // no token equals not logged in, so redirect to login
            next({
                name: 'login'
            })
        }

        //CHECK IF TOKEN IS VALID BY RETRIEVING USER DATA
        //TODO: this works but is also expensive, it should be possible to just check if the token has expired client side
        const url = `${BASE_API_URL}/api/users/me`
        let response = undefined
        try {
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionStore.getToken()}`
                }
            })
        } catch (error) {
            console.log('ERROR - redirect to login', error)
            next({
                name: 'login'
            })
        }

        if (!response) {
            console.log('ERROR no response - redirect to login')
            next({
                name: 'login'
            })
        }

        if (response.status != 200) {
            console.log('ERROR bad status - redirect to login: ' + response.status)
            next({
                name: 'login'
            })
        }

        // user has a valid token, proceed
        next()
    } else {
        // the route doesn't require authentication, proceed as normal
        next()
    }
})

export default router
