<script setup>
import { RouterView } from 'vue-router'
import {onMounted, onUnmounted, ref, watch} from 'vue'
import { useBrowserStore } from '@/stores/browser.js'

const browserStore = useBrowserStore()
const browserWidth = ref(window.innerWidth)

const updateWidth = () => {
  browserWidth.value = window.innerWidth
}

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

onMounted(() => {
    window.addEventListener('resize', updateWidth)
    const darkModeCookie = getCookie('darkMode')
    if (darkModeCookie === 'true' || darkModeCookie === undefined) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    if (window.innerWidth <= 768) {
        browserStore.isMobile = true
    } else {
        browserStore.isMobile = false
    }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})

watch(browserWidth, (newWidth) => {
    if (newWidth <= 768) {
        browserStore.isMobile = true
    } else {
        browserStore.isMobile = false
    }
})
</script>

<template>
    <RouterView />
</template>

<style>
body {
    font-family: 'Poppins', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
::-webkit-scrollbar {
    width: 0px;
}
@media (max-width: 768px) {
    .mobilehide {
        display:none !important;
    }
}
</style>
