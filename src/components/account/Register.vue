<template>
    <div
        class="flex h-screen bg-ngreyblack bg-bottom bg-auto bg-[url('/assets/bg_pattern_01.png')]"
    >
        <div
            class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 m-auto w-full max-w-[1100px]"
        >
            <div
                class="bg-nwhite mx-auto rounded-xl text-black flex p-3 shadow-xl w-full"
            >
                <div
                    class="bg-gradient-to-b from-black to-gray-900 bg-[#18351C] rounded-xl text-left text-gray-400 hidden md:inline bg-bottom bg-auto bg-[url('/assets/bg_pattern_01.png')]"
                >
                    <div class="flex flex-col justify-center">
                        <div class="p-10 min-w-[500px] max-w-[890px]">
                            <router-link to="/">
                                <img
                                    class="mb-16 h-10 w-auto"
                                    src="/assets/nendo_logo.png"
                                    alt="Nendo"
                                />
                            </router-link>
                            <!-- <h1
                                class="text-5xl xl:text-6xl font-black tracking-tight text-white"
                            >
                                Welcome to
                                the AI Audio toolsuite
                            </h1> -->
                        </div>
                    </div>
                </div>
                <div
                    class="my-8 md:my-10 mx-4 md:mx-8 md:pl-6 w-full xl:max-w-md"
                >
                    <router-link to="/">
                        <img
                            class="mb-8 h-6 w-auto md:hidden"
                            src="/assets/nendo_logo.png"
                            alt="Nendo"
                        />
                    </router-link>
                    <h1
                        class="text-3xl md:text-4xl font-bold leading-9 tracking-tight"
                    >
                        Create account
                    </h1>
                    <p class="mt-3 mb-8 text-gray-400">
                        Already have an account?
                        <router-link to="login">
                            <a
                                href="#"
                                class="font-semibold leading-6 text-ngreen hover:text-ngreenhover"
                                >Login</a
                            >
                        </router-link>
                    </p>
                    <!--                    <button-->
                    <!--                        type="submit"-->
                    <!--                        class="flex w-full justify-center bg-white rounded-xl border-2 hover:border-black px-3 py-1.5 mb-3 font-semibold leading-6 text-black"-->
                    <!--                        @click="loginWithGoogle()"-->
                    <!--                    >-->
                    <!--                        <img-->
                    <!--                            src="/assets/login_logo_google.png"-->
                    <!--                            class="h-4 mt-1 mr-4"-->
                    <!--                        />-->
                    <!--                        Sign up with Google-->
                    <!--                    </button> -->
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
                                for="invite_code"
                                class="block font-medium leading-6"
                                >Invite Code</label
                            >
                            <div class="mt-2">
                                <input
                                    id="invite_code"
                                    name="invite_code"
                                    v-model="userdata.invite_code"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 hover:border-black p-2 rounded-xl focus:border-ngreen"
                                    placeholder="Enter your invite code"
                                />
                            </div>
                            <div
                                v-if="!userdata.invite_code"
                                class="text-sm mt-3 text-gray-400"
                            >
                                🗙 Invalid Invite Code
                            </div>
                        </div>
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
                        <div>
                            <label
                                for="password"
                                class="block font-medium leading-6"
                                >Password</label
                            >
                            <div class="mt-2 relative">
                                <input
                                    v-if="showPassword"
                                    id="password"
                                    name="password"
                                    type="password"
                                    autocomplete="current-password"
                                    v-model="userdata.password"
                                    required
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 hover:border-black p-2 rounded-xl focus:border-ngreen pr-10"
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
                                    class="block w-full bg-white text-gray-700 placeholder:text-gray-400 sm:leading-6 focus:outline-none border-2 hover:border-black p-2 rounded-xl focus:border-ngreen pr-10"
                                    placeholder="Enter your password"
                                />
                                <div
                                    class="cursor-pointer ml-2 absolute top-[10px] right-4 text-gray-300"
                                >
                                    <font-awesome-icon
                                        icon="eye-slash"
                                        @click="toggleShow()"
                                        v-if="!showPassword"
                                    />
                                    <font-awesome-icon
                                        icon="eye"
                                        @click="toggleShow()"
                                        v-else
                                    />
                                </div>
                            </div>
                            <div
                                class="grid grid-rows-2 grid-flow-col gap-2 text-sm mt-4 mb-8 text-gray-400"
                            >
                                <div>
                                    <b class="mr-1" id="pw_minchar">🗙</b> 8
                                    characters minimum
                                </div>
                                <div>
                                    <b class="mr-1" id="pw_num">🗙</b> 1 number
                                </div>
                                <div>
                                    <b class="mr-1" id="pw_specialchar">🗙</b> 1
                                    special character
                                </div>
                                <div>
                                    <b class="mr-1" id="pw_uppercase">🗙</b> 1
                                    uppercase character
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
                                v-model="userdata.terms"
                            />
                            <label for="terms" class="text-sm"
                                >I agree to the
                                <a href="">Terms & Conditions</a> and
                                <a href="">Privacy Policy</a></label
                            >
                        </div>
                        <div class="pt-6">
                            <button
                                id="signupsubmitbtn"
                                :disabled="
                                    !userdata.email_valid ||
                                    !userdata.password_valid ||
                                    !userdata.terms
                                "
                                class="flex w-full justify-center rounded-xl bg-ngreen px-3 py-3 py-1.5 font-semibold leading-6 text-white shadow-sm hover:bg-ngreenhover cursor-pointer"
                                @click="registerUser()"
                            >
                                Create account <span class="ml-2">></span>
                            </button>
                        </div>
                    </div>
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
    invite_code: '',
    email: '',
    email_valid: false,
    password: '',
    password_valid: false,
    terms: true
})

const showPassword = ref(true)

function toggleShow() {
    showPassword.value = !showPassword.value
}

function isStringValid(currentValue) {
    const iconValid = '✅'
    const iconInvalid = '🗙'

    const isLongEnough = currentValue.length >= 8
    if (isLongEnough) {
        document.getElementById('pw_minchar').innerHTML = iconValid
    } else {
        const el = document.getElementById('pw_minchar')
        if (el) {
            el.innerHTML = iconInvalid
        }
    }

    const hasNumber = /\d/.test(currentValue)
    if (hasNumber) {
        document.getElementById('pw_num').innerHTML = iconValid
    } else {
        const el = document.getElementById('pw_num')
        if (el) {
            el.innerHTML = iconInvalid
        }
    }

    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(currentValue)
    if (hasSpecialChar) {
        document.getElementById('pw_specialchar').innerHTML = iconValid
    } else {
        const el = document.getElementById('pw_specialchar')
        if (el) {
            el.innerHTML = iconInvalid
        }
    }

    const hasUpperCase = /[A-Z]/.test(currentValue)
    if (hasUpperCase) {
        document.getElementById('pw_uppercase').innerHTML = iconValid
    } else {
        const el = document.getElementById('pw_uppercase')
        if (el) {
            el.innerHTML = iconInvalid
        }
    }

    return isLongEnough && hasNumber && hasSpecialChar && hasUpperCase
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

async function registerUser() {
    await sessionStore.registerUser(
        userdata.email,
        userdata.password,
        userdata.invite_code
    )
}

const loginWithGoogle = async () => {
    await sessionStore.loginWithGoogle()
}

watch(
    () => userdata.email,
    (currentValue, oldValue) => {
        if (currentValue) {
            userdata.email_valid = true
        } else {
            userdata.email_valid = false
        }
    }
)
watch(
    () => userdata.password,
    (currentValue, oldValue) => {
        if (currentValue && isStringValid(currentValue)) {
            userdata.password_valid = true
        } else {
            userdata.password_valid = false
        }
    }
)
</script>

<style scoped>
#signupsubmitbtn:disabled {
    cursor: not-allowed;
    opacity: 1;
}
</style>
