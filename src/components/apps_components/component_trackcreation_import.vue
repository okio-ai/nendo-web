<script setup>
import { reactive } from 'vue'
import { Dashboard } from '@uppy/vue'
import Uppy from '@uppy/core'
import XHR from '@uppy/xhr-upload'
import { useSessionStore } from '@/stores/session.js'
import CollectionPicker from '@/components/apps_components/component_collection_picker.vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'

const sessionStore = useSessionStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

const emit = defineEmits(['file-upload-success', 'file-upload-error', 'file-upload-start', 'file-upload-cancel'])

// Define reactive data properties
const state = reactive({
    headers: {
        'X-Csrf-Token': 'xxxx',
        Authorization: `Bearer ${sessionStore.getToken()}`
    },
    collectionId: '',
    selectedGeneratorId: '',
    generator : [
        {
            id: '',
            name: '',
        },
        { 
            id: 'musicanalysis',
            name: 'Music Analysis',
        },
        { 
            id: 'voiceanalysis',
            name: 'Voice Analysis',
        },
    ]
})

const props = defineProps({
    accept: {
        type: String,
        default: 'audio/*,application/zip,application/tar,application/gzip'
    },
    extensions: {
        type: String,
        default: 'mp3,wav,aiff,flac,zip,tar,gz'
    }
})

const isDarkMode = document.documentElement.classList.contains('dark');

const closeModal = () => {
    state.filesUploadedCounter = 0
    emit('file-upload-cancel')
}

const handleCollectionSelect = (collectionId, collectionName) => {
    state.collectionId = collectionId
}

const getUploadUrl = () => {
    return `${BASE_API_URL}/api/v1/assets/audio?collection_id=${state.collectionId}&run_action=${state.selectedGeneratorId}`
}

const uppy = new Uppy({
    id: 'uppy',
    autoProceed: false,
    debug: false,
    restrictions: {
        maxFileSize: 1024 * 1024 * 200, // 200MB
        minNumberOfFiles: 1,
        allowedFileTypes: props.accept.split(",")
    }
}).use(XHR, { 
    endpoint: getUploadUrl(), 
    headers: state.headers 
})

// define event emitters
uppy.on('upload', (_) => {
    const xhrPlugin = uppy.getPlugin("XHRUpload");
    xhrPlugin.setOptions({
        endpoint: getUploadUrl()
    })
    emit("file-upload-start")
})

uppy.on('complete', (_) => {
   emit("file-upload-success")
})

uppy.on('error', (error) => {
    emit("file-upload-error", error)
})

uppy.on('cancel-all', () => {
    emit("file-upload-cancel")
})


</script>

<template>
    <div class="flex flex-col justify-center px-1">
        <div class="text-gray-300 pb-3 font-bold text-npurple text-md">
            Before upload
        </div>
        <div class="text-sm rounded mb-4">
            <div class="mb-4">
                <div class="mb-2 text-md">
                    Add files to collection
                </div>
                <CollectionPicker @collection-select="handleCollectionSelect"></CollectionPicker>
            </div>
            <div>
                <div class="mb-2 text-md">
                    Run tool on files
                </div>
                <select v-model="state.selectedGeneratorId"
                    :class="{ 'text-gray-400': !state.selectedGeneratorId, 'text-gray-800 dark:text-gray-300': state.selectedGeneratorId }"
                    class="block w-full p-2 border border-gray-600 dark:border-gray-700 rounded-md bg-transparent">
                    <option value="" disabled hidden>Select tool</option>
                    <option v-for="option in state.generator" :key="option.id" :value="option.id">
                        {{ option.name }}
                    </option>
                </select>
            </div>
        </div>
        <Dashboard 
            :uppy="uppy" 
            :plugins="['XHR']" 
            :props="{
                proudlyDisplayPoweredByUppy: false,
                theme: isDarkMode ? 'dark' : 'light',
                inline: true,
                width: 600
            }" 
        />
    </div>
</template>

<style scoped>
.btn {
    /* border: 1px solid #3b82f6; */
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
}
.btn-success {
    background-color: #5C59F6;
    color:white;
    font-weight: 500;
}
.btn-danger {
    border: 1px solid #ff5d5d;
    color:#ff5d5d;
    font-weight: 500;
}
table th {
    padding-top: 10px;
    padding-bottom: 10px;
}
th,
td {
    padding: 0px;
}
.example-full .btn-group .dropdown-menu {
    position: absolute;
    display: block;
    visibility: hidden;
    transition: all 0.2s;
}
.example-full .btn-group:hover > .dropdown-menu {
    visibility: visible;
}

.example-full label.dropdown-item {
    margin-bottom: 0;
}

.example-full .btn-group .dropdown-toggle {
    margin-right: 0.6rem;
}
.progress {
    display: -ms-flexbox;
    display: flex;
    overflow: hidden;
    font-size: 0.75rem;
    line-height: 1rem;
    text-align: center;
    background-color: #e9ecef;
    border-radius: 0.25rem;
    margin-right: 10px;
    margin-left: 10px;
    margin-bottom: 20px;
}
.progress-bar-striped {
    background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
    );
    background-size: 1rem 1rem;
}
.progress-bar {
    height: 1rem;
    line-height: 1rem;
    color: #fff;
    background-color: #007bff;
    transition: width 0.6s ease;
}

.example-full .filename {
    /* margin-bottom: 0.3rem; */
}

.example-full .btn-is-option {
    margin-top: 0.25rem;
}

.example-full .edit-image img {
    max-width: 100%;
}

.example-full .edit-image-tool {
    margin-top: 0.6rem;
}

.example-full .edit-image-tool .btn-group {
    margin-right: 0.6rem;
}

.example-full .footer-status {
    padding-top: 0.4rem;
}

.example-full .drop-active {
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    position: fixed;
    z-index: 9999;
    opacity: 0.6;
    text-align: center;
    background: #000;
}

.example-full .drop-active h3 {
    margin: -0.5em 0 0;
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    -webkit-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    font-size: 40px;
    color: #fff;
    padding: 0;
}
</style>
