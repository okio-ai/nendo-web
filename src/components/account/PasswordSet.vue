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
                            Set Password
                        </h1>
                        <p class="ml-auto mt-3 mb-8 text-gray-400">
                            Enter a new password for your account.
                        </p>
                    </div>

                    <div class="space-y-4" action="#" method="POST">
                        <div>
                            <label
                                for="password"
                                class="block font-medium leading-6"
                                >Password</label
                            >
                            <div class="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autocomplete="password"
                                    v-model="userdata.password"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 hover:border-black p-2 rounded-xl focus:border-ngreen"
                                    placeholder="Enter your password"
                                />
                            </div>
                            <div
                                v-if="
                                    userdata.password &&
                                    !isValidPassword(userdata.password)
                                "
                                class="text-sm mt-3 text-gray-400"
                            >
                                🗙 Invalid Email
                            </div>
                        </div>
                        <div class="pt-6">
                            <button
                                :disabled="!isValidPassword(userdata.password)"
                                class="flex w-full justify-center rounded-xl bg-ngreen px-3 py-3 py-1.5 font-semibold leading-6 text-white shadow-sm hover:bg-ngreenhover cursor-pointer"
                                @click="requestResetPassword()"
                            >
                                Set password
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
import { onMounted, reactive, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.js'
import { useRoute } from 'vue-router'

const sessionStore = useSessionStore()

const route = useRoute()

let token = ''

onMounted(async () => {
    token = route.params.token
})

const userdata = reactive({
    email: '',
    email_valid: false,
    password: '',
    password_valid: false,
    remember: true
})

function isValidPassword(email) {
    //TODO SET VALID PASSWORD
    //const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    //return emailRegex.test(email)
    return true
}

function requestResetPassword() {
    sessionStore.setPassword(userdata.password, token)
}
</script>

<style scoped>
#signupsubmitbtn:disabled {
    cursor: not-allowed;
    opacity: 1;
}
</style>
