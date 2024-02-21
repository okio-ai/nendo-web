<script setup>
import {   ref, reactive, onMounted } from 'vue'
import FileUpload from 'vue-upload-component'
import { useSessionStore } from '@/stores/session.js'
import CollectionPicker from '@/components/apps_components/component_collection_picker.vue'

const sessionStore = useSessionStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

const uploadRef = ref(null)

const emit = defineEmits(['file-upload-success', 'file-upload-error', 'file-upload-start', 'file-upload-cancel'])

// Define reactive data properties
const state = reactive({
    files: [],
    filesUploadedCounter: 0,
    minSize: 1024,
    size: 1024 * 1024 * 10000,
    multiple: true,
    directory: false,
    drop: true,
    dropDirectory: true,
    createDirectory: false,
    addIndex: false,
    thread: 3,
    name: 'file',
    headers: {
        'X-Csrf-Token': 'xxxx',
        Authorization: `Bearer ${sessionStore.getToken()}`
    },
    data: {
        _csrf_token: 'xxxxxx'
    },
    autoCompress: 1024 * 1024,
    uploadAuto: false,
    isOption: false,
    addData: {
        show: false,
        name: '',
        type: '',
        content: ''
    },
    editFile: {
        show: false,
        name: ''
    },
    collectionId: '',
    selectedGeneratorId: '',
    generator : [
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

const closeModal = () => {
    state.filesUploadedCounter = 0
    emit('file-upload-cancel')
}

const inputFilter = (newFile, oldFile, prevent) => {
    if (newFile && !oldFile) {
        // Before adding a file
        // Filter system files or hide files
        if (
            /(\/|^)(Thumbs\.db|desktop\.ini|\..+)$/.test(newFile.name)
        ) {
            return prevent()
        }

        // Filter php html js file
        if (
            /\.(php5?|html?|jsx?)$/i.test(newFile.name) &&
            newFile.type !== 'text/directory'
        ) {
            return prevent()
        }
    }

    if (
        newFile &&
        newFile.error === '' &&
        newFile.file &&
        (!oldFile || newFile.file !== oldFile.file)
    ) {
        // Create a blob field
        newFile.blob = ''
        let URL = window.URL || window.webkitURL
        if (URL) {
            newFile.blob = URL.createObjectURL(newFile.file)
        }
    }
}

// add, update, remove File Event
const inputFile = (newFile, oldFile) => {
    if (newFile && oldFile) {
        // update

        if (newFile.active && !oldFile.active) {
            // beforeSend
            newFile.postAction = getUploadUrl()
            emit('file-upload-start', newFile)
            // min size
            if (
                newFile.size >= 0 &&
                state.minSize > 0 &&
                newFile.size < state.minSize &&
                newFile.type !== 'text/directory'
            ) {
                uploadRef.value.update(newFile, { error: 'size' })
            }
        }

        if (newFile.progress !== oldFile.progress) {
            // progress
        }

        if (newFile.error && !oldFile.error) {
            // error
            
            emit('file-upload-error', newFile)
        }

        if (newFile.success && !oldFile.success) {
            // success
            state.filesUploadedCounter += 1
            if (state.filesUploadedCounter >= state.files.length) {
                emit('file-upload-success', newFile)
            }
        }
    }

    if (!newFile && oldFile) {
        // remove
        if (oldFile.success && oldFile.response.id) {
            // $.ajax({
            //   type: 'DELETE',
            //   url: '/upload/delete?id=' + oldFile.response.id,
            // })
        }
    }

    // Automatically activate upload
    if (
        Boolean(newFile) !== Boolean(oldFile) ||
        oldFile.error !== newFile.error
    ) {
        if (state.uploadAuto && !uploadRef.value.active) {
            uploadRef.value.active = true
        }
    }
}

const alertMessage = (message) => {
    alert(message)
}

const onEditFileShow = (file) => {
    state.editFile = { ...file, show: true }
    if (uploadRef.value) {
        uploadRef.value.update(file, { error: 'edit' })
    }
}

const onEditorFile = () => {
    if (uploadRef.value && !uploadRef.value.features.html5) {
        alertMessage('Your browser does not support uploading files')
        state.editFile.show = false
        return
    }

    let data = {
        name: state.editFile.name,
        error: ''
    }

    if (uploadRef.value) {
        uploadRef.value.update(state.editFile.id, data)
    }
    state.editFile.error = ''
    state.editFile.show = false
}

// add folder
const onAddFolder = () => {
    if (uploadRef.value && !uploadRef.value.features.directory) {
        alertMessage('Your browser does not support uploading folders')
        return
    }
    let input = document.createElement('input')
    input.style =
        'background: rgba(255, 255, 255, 0);overflow: hidden;position: fixed;width: 1px;height: 1px;z-index: -1;opacity: 0;'
    input.type = 'file'
    input.setAttribute('allowdirs', true)
    input.setAttribute('directory', true)
    input.setAttribute('webkitdirectory', true)
    input.multiple = true
    document.querySelector('body').appendChild(input)
    input.click()
    input.onchange = (e) => {
        uploadRef.value.addInputFile(input).then(function () {
            document.querySelector('body').removeChild(input)
        })
    }
}

const onAddData = () => {
    state.addData.show = false
    if (uploadRef.value && !uploadRef.value.features.html5) {
        alertMessage('Your browser does not support uploading files')
        return
    }

    let file = new window.File(
        [state.addData.content],
        state.addData.name,
        {
            type: state.addData.type
        }
    )
    
    if (uploadRef.value) {
        uploadRef.value.add(file)
    }
}

const handleCollectionSelect = (collectionId, collectionName) => {
    state.collectionId = collectionId
}

const getUploadUrl = () => {
    return `${BASE_API_URL}/api/v1/assets/audio?collection_id=${state.collectionId}&run_action=${state.selectedGeneratorId}`
}

defineProps({
    accept: {
        type: String,
        default: 'audio/mpeg,audio/wav,audio/flac,application/zip,application/tar,application/gzip'
    },
    extensions: {
        type: String,
        default: 'mp3,wav,aiff,flac,zip,tar,gz'
    }
})
</script>

<template>
    <div>
        <div class="flex example-full hidden">
            <div class="btn-group inline-block mr-4 border rounded-md px-4 pt-1">
                <file-upload
                    :post-action="getUploadUrl()"
                    :extensions="state.extensions"
                    :accept="state.accept"
                    :multiple="state.multiple"
                    :directory="state.directory"
                    :create-directory="state.createDirectory"
                    :size="state.size || 0"
                    :thread="state.thread < 1 ? 1 : state.thread > 5 ? 5 : state.thread"
                    :headers="state.headers"
                    :data="state.data"
                    :drop="state.drop"
                    :drop-directory="state.dropDirectory"
                    :add-index="state.addIndex"
                    v-model="state.files"
                    @input-filter="inputFilter"
                    @input-file="inputFile"
                    ref="uploadRef"
                >
                    <font-awesome-icon icon="plus" class="mr-1" />
                    Select File
                </file-upload>
            </div>
        </div>
        
        <div class="example-full">
            <div
                v-show="uploadRef && uploadRef.dropActive"
                class="drop-active"
            >
                <h3>Drop files to upload</h3>
            </div>
            <div class="upload" v-show="!state.isOption">
                <template v-if="state.files.length">
                    <div class="text-gray-300 pb-3 font-bold text-npurple text-md">
                        {{ state.files.length }} file<template v-if="state.files.length > 1">s</template> to upload
                    </div>
                </template>
                <div class="w-full max-h-[40vh] overflow-auto bg-ngreytransparent">
                    <table class="w-full text-left text-sm">
                        <!-- <thead class="border-b border-gray-300 dark:border-black font-regular">
                            <tr>
                                <th><div class="px-3">#</div></th>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Status</th>
                            </tr>
                        </thead> -->
                        <tbody class="w-full">
                            <tr v-if="!state.files.length">
                                <td colspan="9">
                                    <div class="text-center p-20 border border-gray-300 dark:border-gray-400 border-dashed text-gray-300">
                                        <h2 class="pb-4 mb-4">
                                            Drop file to upload or
                                        </h2>
                                        <label :for="state.name" class="bg-npurple text-white font-medium py-2 px-4 rounded-md cursor-pointer text-xl">
                                            <font-awesome-icon icon="plus" class="mr-1" />
                                            Select File
                                        </label>
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="(file) in state.files" :key="file.id" class="border border-gray-700 pb-4">
                                <!-- <td><div class="px-3">{{ index }}</div></td> -->
                                <td>
                                    <div class="filename p-3">
                                        {{ file.name }}
                                    </div>
                                    <div
                                        class="progress"
                                        v-if="
                                            file.active || file.progress !== '0.00'
                                        "
                                    >
                                        <div
                                            :class="{
                                                'progress-bar': true,
                                                'progress-bar-striped': true,
                                                'bg-danger': file.error,
                                                'progress-bar-animated': file.active
                                            }"
                                            role="progressbar"
                                            :style="{ width: file.progress + '%' }"
                                        >
                                            {{ file.progress }}%
                                        </div>
                                    </div>
                                </td>
                                <!-- <td>{{ file.size || 0 }}</td> -->
                                <!-- <td>{{ file.speed || 0 }}</td> -->
                                <td v-if="file.error" class="w-20"><div class="mt-6 ml-4">{{ file.error }}</div></td>
                                <!-- <td v-else-if="file.success" class="w-20"><div class="mt-6 ml-4">success</div></td>
                                <td v-else-if="file.active" class="w-20"><div class="mt-6 ml-4">uploading</div></td> -->
                                <td v-else></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div v-if="state.files.length > 0 && !uploadRef.active" class="mb-6">
            <div class="text-gray-300 pb-3 font-bold text-npurple mt-5 text-md">
                    After upload 
                </div>
            <div class="text-sm rounded">
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
                    <select v-model="state.selectedGeneratorId" :class="{'text-gray-400': !state.selectedGeneratorId, 'text-gray-800 dark:text-gray-300': state.selectedGeneratorId}" class="block w-full p-2 border border-gray-600 dark:border-gray-700 rounded-md bg-transparent">
                        <option value="" disabled hidden>Select tool</option>
                        <option v-for="option in state.generator" :key="option.id" :value="option.id">
                            {{ option.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="mt-6">
            <template v-if="state.files.length > 0">
                <button
                    type="button"
                    class="btn btn-success align-top rounded-md"
                    v-if="!uploadRef || !uploadRef.active"
                    @click.prevent="uploadRef.active = true"
                >
                    <font-awesome-icon icon="upload" class="mr-1" />
                    Start Upload
                </button>
                <button
                    type="button"
                    class="btn btn-danger align-top rounded-md"
                    v-else
                    @click.prevent="uploadRef.active = false"
                >
                    <font-awesome-icon icon="pause" class="mr-1" />
                    Stop Upload
                </button>
            </template>
            <button v-if="!uploadRef || !uploadRef.active" class="float-right px-4 py-2 text-md bg-gray-300 dark:bg-gray-800 hover:bg-npurple text-white font-medium rounded-lg focus:outline-none" @click="closeModal">
                Cancel
            </button>
        </div>
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
