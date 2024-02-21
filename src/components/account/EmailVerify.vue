<script setup>
import { reactive, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.js'
import { useBrowserStore } from '@/stores/browser.js'

const sessionStore = useSessionStore()

const logout = () => {
    sessionStore.unsetToken()
    window.location.href = '/'
}
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
                            An email has been sent to your address with a link
                            to verify.
                        </h1>
                    </div>
                    <div class="flex my-6">
                        <div
                            class="w-[88%] bg-gray-200 h-[1px] mt-3 mr-4"
                        ></div>
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
