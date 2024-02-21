<script setup>
import { reactive, ref, watch } from 'vue'
import { useSessionStore } from '@/stores/session.js'

const sessionStore = useSessionStore()

const userdata = reactive({
    email: '',
    email_valid: true,
    password: '',
    password_valid: true,
    remember: true
})

const showPassword = ref(true)

function toggleShow() {
    this.showPassword = !this.showPassword
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const loginWithGoogle = async () => {
    await sessionStore.loginWithGoogle()
}

const loginWithUserPass = async () => {
    await sessionStore.loginWithUserPass(userdata.email, userdata.password)
}
</script>

<template>
    <div
        class="flex h-screen dark:bg-[rgba(0,0,0,0.1)] bg-ngreyblack shadow bg-bottom bg-auto bg-[url('/assets/bg_pattern_01.png')]"
    >
        <div
            class="flex min-h-full flex-col justify-center py-12 lg:px-8 m-auto w-full max-w-[1100px]"
        >
            <div
                class="bg-nwhite dark:bg-black mx-auto rounded-md text-black dark:text-white w-full md:max-w-xl"
            >
                <div class="border-b border-ngreyblack p-6 md:px-10 rounded-tr-xl rounded-tl-md">
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
                            class="text-3xl md:text-4xl font-bold leading-9 tracking-tight mb-5"
                        >
                            Login
                        </h1>
                        <p class="ml-auto mt-3 mb-8 text-gray-400">
                            or
                            <router-link to="/join">
                                <a
                                    href="#"
                                    class="font-semibold leading-6 text-ngreen hover:text-ngreenhover"
                                >
                                    create an account
                                </a>
                            </router-link>
                        </p>
                    </div>
                    <!--                    <button-->
                    <!--                        type="submit"-->
                    <!--                        class="flex w-full justify-center bg-white rounded-md border-2 hover:border-black px-3 py-3.5 mb-3 font-semibold leading-6 text-black"-->
                    <!--                        @click="loginWithGoogle()"-->
                    <!--                    >-->
                    <!--                        <img-->
                    <!--                            src="/assets/login_logo_google.png"-->
                    <!--                            class="h-4 mt-1 mr-4"-->
                    <!--                        />-->
                    <!--                        Login with Google-->
                    <!--                    </button>-->
                    <!--                    <div class="flex my-6">-->
                    <!--                        <div-->
                    <!--                            class="w-[44%] bg-gray-200 h-[1px] mt-3 mr-4"-->
                    <!--                        ></div>-->
                    <!--                        <div class="w-[2%]">or</div>-->
                    <!--                        <div-->
                    <!--                            class="w-[44%] bg-gray-200 h-[1px] mt-3 ml-4"-->
                    <!--                        ></div>-->
                    <!--                    </div>-->
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
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 p-2 rounded-md focus:border-ngreen"
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
                        <div>
                            <div class="flex items-center justify-between">
                                <label
                                    for="password"
                                    class="block font-medium leading-6"
                                    >Password</label
                                >
<!--                                <router-link to="/forgot">-->
<!--                                    <a-->
<!--                                        class="font-semibold text-ngreen hover:text-ngreenhover"-->
<!--                                        >Forgot password?</a-->
<!--                                    >-->
<!--                                </router-link>-->
                            </div>
                            <div class="mt-2 relative">
                                <input
                                    v-if="showPassword"
                                    id="password"
                                    name="password"
                                    type="password"
                                    autocomplete="current-password"
                                    v-model="userdata.password"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 p-2 rounded-md focus:border-ngreen pr-10"
                                    placeholder="Enter your password"
                                />
                                <input
                                    v-else
                                    id="password"
                                    name="password"
                                    type="text"
                                    autocomplete="current-password"
                                    v-model="userdata.password"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 p-2 rounded-md focus:border-ngreen pr-10"
                                    placeholder="Enter your password"
                                />
                                <div
                                    class="cursor-pointer ml-2 absolute top-3 right-4 text-gray-300"
                                >
                                    <font-awesome-icon
                                        icon="eye"
                                        @click="toggleShow()"
                                        v-if="showPassword"
                                    />
                                    <font-awesome-icon
                                        icon="eye-slash"
                                        @click="toggleShow()"
                                        v-else
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                id="terms"
                                name="terms"
                                class="mr-2 mt-2"
                                checked
                                v-model="userdata.remember"
                            />
                            <label for="terms">Remember me</label>
                        </div>
                        <div class="pt-6">
                            <router-link to="/library">
                                <button
                                    id="signupsubmitbtn"
                                    :disabled="
                                        !userdata.email_valid ||
                                        !userdata.password_valid
                                    "
                                    class="flex w-full justify-center rounded-md bg-ngreen px-3 py-3 py-1.5 font-semibold leading-6 text-white shadow-sm hover:bg-ngreenhover cursor-pointer"
                                    @click="loginWithUserPass()"
                                >
                                    Login <span class="ml-2">></span>
                                </button>
                            </router-link>
                        </div>
                    </div>
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
<style>
input:autofill {
  background: #fff; /* or any other */
}
input {
  filter: none;
}
</style>
