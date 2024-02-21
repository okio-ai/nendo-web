<script setup>

const props = defineProps({
    setting: Object
})

const emit = defineEmits(['update'])
</script>

<template>
    <div v-if="setting" class="relative">
        <select
            :value="setting.value"
            @input="emit('update', $event.target.value)"
            class="appearance-none border border-gray-300 dark:border-gray-700 font-medium w-full h-full rounded-md pr-8 pl-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 bg-white dark:bg-ngreyblack dark:text-white"
        >       
            <option
                v-for="option in setting.options"
                :key="option.key"
                :value="option.value"
            >
                {{ option.key }}
            </option>
        </select>
        <svg class="h-4 w-4 mt-0.5 absolute right-3 top-2 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </div>
</template>