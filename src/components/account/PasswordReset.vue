<template>
    <div
        class="flex h-screen bg-ngreyblack bg-bottom bg-auto bg-[url('/assets/bg_pattern_01.png')]"
    >
        <div
            class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 m-auto w-full max-w-[1100px]"
        >
            <div
                class="bg-nwhite mx-auto rounded-xl text-black w-full md:max-w-xl"
            >
                <div
                    class="bg-nwhite border-b p-6 md:px-10 rounded-tr-xl rounded-tl-xl"
                >
                    <router-link to="/">
                        <img
                            class="h-8 w-auto"
                            src="/assets/nendo_logo.png"
                            alt="Nendo"
                        />
                    </router-link>
                </div>
                <div class="m-6 md:m-10 md:mt-6">
                    <div>
                        <h1
                            class="text-3xl md:text-4xl font-bold leading-9 tracking-tight"
                        >
                            Password reset
                        </h1>
                        <p class="ml-auto mt-3 mb-8 text-gray-400">
                            Enter your account's email and we'll send you a
                            password reset link
                        </p>
                    </div>

                    <div class="space-y-4" action="#" method="POST">
                        <div>
                            <label
                                for="email"
                                class="block font-medium leading-6"
                                >Email</label
                            >
                            <div class="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autocomplete="email"
                                    v-model="userdata.email"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 hover:border-black p-2 rounded-xl focus:border-ngreen"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div
                                v-if="
                                    userdata.email &&
                                    !isValidEmail(userdata.email)
                                "
                                class="text-sm mt-3 text-gray-400"
                            >
                                🗙 Invalid Email
                            </div>
                        </div>
                        <div class="pt-6">
                            <button
                                :disabled="!isValidEmail(userdata.email)"
                                class="flex w-full justify-center rounded-xl bg-ngreen px-3 py-3 py-1.5 font-semibold leading-6 text-white shadow-sm hover:bg-ngreenhover cursor-pointer"
                                @click="requestResetPassword()"
                            >
                                Send password reset email
                            </button>
                        </div>
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

<script setup>
import { reactive, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.js'

const sessionStore = useSessionStore()

const userdata = reactive({
    email: '',
    email_valid: false,
    password: '',
    password_valid: false,
    remember: true
})

const showPassword = ref(true)

function toggleShow() {
    showPassword.value = !showPassword.value
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

function requestResetPassword() {
    sessionStore.requestResetPassword(userdata.email)
}
</script>

<style scoped>
#signupsubmitbtn:disabled {
    cursor: not-allowed;
    opacity: 1;
}
</style>
