<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    id: String,
    setting: Object
})

let dropDownOpen = ref(false)
const searchText = ref('')

function deleteItem(val, event) {
    event.preventDefault()
    const item = props.setting.value
    const itemIndex = item.findIndex((i) => i === val)
    item.splice(itemIndex, 1)
    searchText.value = ''
    emit('update', item)
}
function addItem(val) {
    const item = props.setting.value
    item.push(val)
    emit('update', item)
    searchText.value = ''
}

const getItems = computed(() => {
    const items = []
    for (let i = 0; i < props.setting.options.length; i++) {
        const itemIndex = props.setting.value.findIndex(
            (item) => item === props.setting.options[i]
        )
        if (itemIndex === -1) {
            items.push(props.setting.options[i])
        }
    }
    console.log(items)
    return items.filter((node) =>
        node.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
})

const emit = defineEmits(['update'])
</script>

<template>
    <div class="w-full flex flex-col items-center text-black">
        <div class="w-full min-w-[100px]">
            <div class="flex flex-col items-center relative">
                <div class="w-full">
                    <div
                        class="p-1.5 flex border border-gray-200 rounded-md"
                        @click="dropDownOpen = !dropDownOpen"
                    >
                        <div class="flex flex-auto flex-wrap">
                            <div
                                class="flex justify-center items-center m-1 font-medium py-1 px-2 bg-gray-100 capitalize rounded-md text-black"
                                v-for="(val, index) in props.setting.value"
                                :key="index"
                            >
                                <div
                                    class="text-[14px] font-normal leading-none max-w-full flex-initial"
                                >
                                    {{ val.name }}
                                </div>
                                <div
                                    class="flex flex-auto flex-row-reverse"
                                    @click="deleteItem(val, $event)"
                                >
                                    <div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="100%"
                                            height="100%"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            class="feather feather-x cursor-pointer hover:text-teal-400 rounded-full w-4 h-4 ml-2"
                                        >
                                            <line
                                                x1="18"
                                                y1="6"
                                                x2="6"
                                                y2="18"
                                            ></line>
                                            <line
                                                x1="6"
                                                y1="6"
                                                x2="18"
                                                y2="18"
                                            ></line>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div class="flex-1">
                                <input
                                    placeholder="Select"
                                    class="bg-transparent p-1 px-2 appearance-none outline-none text-gray-200 text-xs max-w-[60px]"
                                    v-model="searchText"
                                    @change="dropDownOpen = true"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="absolute shadow top-100 bg-white z-40 w-full lef-0 rounded-md max-h-select overflow-y-auto"
                    v-if="dropDownOpen"
                >
                    <div class="flex flex-col w-full">
                        <div
                            class="cursor-pointer w-full border-gray-100 rounded-t-md border-b hover:bg-teal-100"
                            v-for="(option, index) in getItems"
                            :key="index"
                        >
                            <div
                                class="flex w-full items-center p-2 pl-2 border-transparent border-l-2 relative hover:border-teal-100"
                                @click="addItem(option)"
                            >
                                <div class="w-full items-center flex">
                                    <div class="mx-2 leading-6">
                                        {{ option.name }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.top-100 {
    top: 100%;
}
.bottom-100 {
    bottom: 100%;
}
.max-h-select {
    max-height: 300px;
}
.flip-svg {
    transform: scaleY(-1);
}
</style>
