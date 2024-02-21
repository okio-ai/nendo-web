<script setup>
import { ref, watchEffect,   nextTick } from 'vue'

const props = defineProps({
    title: String,
    open: Boolean,
    isCloseable: {
        type: Boolean,
        default: true,
        required: false
    },
})

let isOpen = ref(props.open)
let popover = ref(null)

watchEffect(() => {
    isOpen.value = props.open
    if (isOpen.value) {
        nextTick(() => {
            if (popover.value) {
                popover.value.focus()
            }
        })
    }
})

const emit = defineEmits(['update:open'])

function closePopover() {
    if (props.isCloseable) {
        isOpen.value = false
        emit('update:open', false)
    }
}
</script>

<template>
    <div class="mx-auto">
        <div
            class="fixed text-black dark:text-white inset-0 flex items-center justify-center z-50 bg-[rgba(0,0,0,0.8)]"
            v-if="isOpen"
            :ref="popover"
            tabindex="0"
            @keydown.esc="closePopover()"
            @click.stop
            @click="closePopover()"
        >
            <div class="rounded-md p-5 pt-4 bg-white dark:bg-ngreyblack popover-container" @click.stop> <!-- Updated class here -->
                <div v-if="props.title.length > 0">
                    <button
                        class="top-2 float-right cursor-pointer text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-400"
                        @click="closePopover()"
                    >
                        <font-awesome-icon icon="x" />
                    </button>
                    <div class="font-bold text-xl">{{ props.title }}</div>
                </div>
                <slot />
            </div>
        </div>
    </div>
</template>


<style scoped>
.popover-container{
    min-width: 650px;
}
@media (max-width: 768px) {
    .popover-container {
        width: 100vw; /* Full viewport width */
        height: 100vh; /* Full viewport height */
        min-width: 100vw; /* Override any min-width */
        max-width: 100vw; /* Ensure it doesn't exceed the viewport width */
        border-radius: 0; /* Optional: remove border radius for full screen */
        padding: 15px; /* Adjust padding as needed for full screen */
    }
}
</style>
