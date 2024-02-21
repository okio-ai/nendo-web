<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session.js'
import { useBrowserStore } from '@/stores/browser.js'

const route = useRoute()
const router = useRouter()
const browserStore = useBrowserStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

onMounted(async () => {
    /*
    this code intercepts the callback from the OAuth provider, extracts query params, then relays it to the backend
    to complete the oauth flow in exchange for a token
    */

    const sessionStore = useSessionStore()
    let url =
        `${BASE_API_URL}/api/auth/google/callback?code=` +
        encodeURIComponent(route.query.code) +
        '&state=' +
        encodeURIComponent(route.query.state)

    try {
        let result = await fetch(url)
        const auth_token = await result.json()
        if (auth_token.access_token) {
            // User has an access_token
            // Save the token to local storage
            sessionStore.setToken(auth_token.access_token)
            browserStore.intro.modal = true
            await router.push({ path: '/project/' })
        } else {
            console.log('OAuth token incomplete, sending user back to login')
            await router.push({ path: '/login' })
        }
    } catch (e) {
        console.log('LOGIN FAILED:', e)
    }
})
</script>

<template>
    <main></main>
</template>
