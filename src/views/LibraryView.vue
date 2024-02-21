<script setup>
import { onMounted, ref } from 'vue'
import NendoLibrary from '@/components/apps/nendo_library/nendo_library_main.vue'
import SidebarComponent from '@/components/shell/Sidebar.vue'
import { useBrowserStore } from '@/stores/browser'

const browserStore = useBrowserStore()
const isResizing = ref(false)
let sidebarElement = null

const initResize = (e) => {
  isResizing.value = true
  document.body.classList.add('no-select')
  document.addEventListener('mousemove', startResizing)
  document.addEventListener('mouseup', stopResizing)
}

const startResizing = (e) => {
  if (isResizing.value && sidebarElement) {
    sidebarElement.style.width = `${e.clientX}px`
  }
}

const stopResizing = () => {
  if (isResizing.value) {
    isResizing.value = false
    document.body.classList.remove('no-select')
    document.removeEventListener('mousemove', startResizing)
    document.removeEventListener('mouseup', stopResizing)
    if(sidebarElement) {
        localStorage.setItem('sidebarWidth', sidebarElement.style.width)
    }
  }
}

onMounted(() => {
    sidebarElement = document.getElementById('sidebar')
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (sidebarElement && savedWidth) {
        sidebarElement.style.width = savedWidth
    }
    browserStore.toolViewActive = false

    if(browserStore.isMobile) {
        browserStore.sidebarActive = false
    }
})
</script>


<template>
    <div class="flex h-screen">
      <div v-show="browserStore.sidebarActive" class="sidebar bg-gray-200" id="sidebar">
        <div class="resize-handle" @mousedown="initResize"></div>
        <SidebarComponent />
      </div>
      <div class="main-content flex-1 overflow-auto">
        <NendoLibrary />
      </div>
    </div>
</template>
  

<style scoped>
.sidebar {
    width: 250px;
    min-width: 250px;
    max-width: 1000px;
    overflow-x: hidden;
    overflow: auto;
    position: relative;
}

.resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 10px;
    cursor: ew-resize;
}
@media (max-width: 768px) {
    .sidebar {
        width: 100%; /* Full width on mobile */
        min-width: 100%; /* Ensure it takes full width */
    }
    .resize-handle {
        display: none; /* Hide resize handle on mobile */
    }
}
</style>
<style>
.no-select {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}
</style>
