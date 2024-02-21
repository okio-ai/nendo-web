<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const gotoLogin = () => {
    router.push({ path: '/login/' })
}
</script>

<template>
    <main
        class="bg-bottom bg-auto cover py-10 px-4 bg-ngreyblack h-screen"
    >
        <div
            class="mx-auto pt-4 pb-6 mb-4 border-b border-gray-700 max-w-[1570px] sticky top-0 z-50"
        >
            <h1
                class="text-black cursor-pointer float-right text-lg bg-ngreenhover font-bold rounded-xl py-2 px-6 mt-1"
                @click="gotoLogin()"
            >
                Log in
            </h1>
            <div class="flex">
                <img class="h-10" src="/assets/nendo_logo.png" alt="" />
            </div>
        </div>
        <div class="mx-auto rounded-xl max-w-[1570px] mb-10 mt-[50px]">
            <div
                class="font-black text-left rounded-xl text-black"
                style="font-size: 8em"
            >
                <div class="flex flex-wrap gap-3 mx-auto">
                    <div
                        class="px-2 rounded-xl bg-[#0AFF78]"
                    >
                        <img
                            src="/assets/icon_01.png"
                            class="w-40 mt-4 p-6"
                        />
                    </div>
                    <div class="bg-[#d58a24] px-10 rounded-xl ml-0">Welcome</div>
                    <div class="bg-[#4273F4] px-4 rounded-xl">
                        <img
                            src="/assets/icon_02.png"
                            class="w-40"
                        />
                    </div>
                    <div class="bg-[#eafbb4] px-10 rounded-xl">to</div>

                    <div class="bg-[#168176] px-4 rounded-xl">
                        <img
                            src="/assets/icon_03.png"
                            class="w-40 p-2 pt-6"
                        />
                    </div>

                    <div class="bg-[#8E81F7] px-10 rounded-xl">the</div>
                    <div class="bg-[#BCAA6E] px-4 rounded-xl">
                        <img
                            src="/assets/icon_04.png"
                            class="w-40 mt-4"
                        />
                    </div>

                    <div class="bg-[#e8c3bb] px-10 rounded-xl">Nendo</div>

                    <div class="bg-[#dba751] px-4 rounded-xl">
                        <img
                            src="/assets/icon_05.png"
                            class="w-40 mt-4 p-2"
                        />
                    </div>

                    <div class="bg-[#db767c] px-10 rounded-xl">Experience</div>

                    <div
                        class="px-2 rounded-xl"
                        style="background-color: rgba(10, 255, 120, 1)"
                    >
                        <img
                            src="/assets/icon_06.png"
                            class="w-40 mt-4 p-6"
                        />
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
