<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session.js'

const sessionStore = useSessionStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

let token = ''
const route = useRoute()

const message = ref('...')

onMounted(async () => {
    token = route.params.token

    const response = await sessionStore.verifyToken(token)
    if (response.status === 200) {
        message.value = 'Your email has been successfully verified!'
    } else {
        message.value = 'There was an error verifying your email.'
    }
})
</script>

<template>
    <div
        class="flex h-screen bg-ngreyblack bg-bottom bg-auto bg-[url('/assets/bg_pattern_01.png')]"
    >
        <div
            class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 m-auto w-full max-w-[1100px]"
        >
            <div
                class="bg-nwhite mx-auto rounded-md text-black w-full md:max-w-xl"
            >
                <div class="border-b p-6 md:px-10 rounded-tr-xl rounded-tl-md">
                    <router-link to="/">
                        <img
                            class="h-10 w-auto"
                            src="/assets/nendo_logo.png"
                            alt="Nendo"
                        />
                    </router-link>
                </div>
                <div class="m-6 md:m-10 md:mt-6">
                    <div class="flex">
                        <h1
                            class="text-2xl md:text-2xl font-bold leading-9 tracking-tight mb-5"
                        >
                            {{ message }}
                        </h1>
                    </div>

                    <p class="mt-10 text-center text-gray-400">
                        Back to
                        <router-link to="/login">
                            <a
                                href="#"
                                class="font-semibold leading-6 text-ngreen hover:text-ngreenhover"
                                >Login</a
                            >
                        </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#signupsubmitbtn:disabled {
    cursor: not-allowed;
    opacity: 1;
}
</style>
