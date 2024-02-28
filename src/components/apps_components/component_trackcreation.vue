<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/apps_components/component_modal.vue'
import Import from '@/components/apps_components/component_trackcreation_import.vue'
import { useTrackStore } from '@/stores/track.js'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'

const router = useRouter()

const props = defineProps({
    modalopen: {
        type: Boolean,
        required: true
    },
    track: {
        type: Object,
        required: true
    },
})

const trackStore = useTrackStore()
const emit = defineEmits(['modalClosed'])
const isOpen = ref(props.modalopen)
const modalName = ref('Edit')
const trackEdit = ref(true)
const uploadFinished = ref(false)
const uploadFailed = ref(false)
const track = ref()
const fileUploadActive = ref(false)
const metaTemp = ref([])
const metaTitleTemp = ref('')
const track_types = ref([
    {id: 'track', name: 'Audio'},
    // {id: 'image', name: 'Image'},
    // {id: 'text', name: 'Text'},
    // {id: 'website', name: 'Website'},
])
const showSettings = ref({
    track: {
        meta: false,
        meta_custom: false
    }
})

const track_addmeta = () => {
    metaTemp.value.push(['fieldname',''])
    updateMetaKey(metaTemp.value.length-1, 'fieldname')
}

const updateMetaKey = (index, newKey) => {
    // Check if newKey already exists in any other metaTemp entry
    let newValue = newKey;
    let existingIndex = metaTemp.value.findIndex((value, idx) => value[0] === newValue && idx !== index);

    // If newKey already exists, modify it by appending a random number until it's unique
    while (existingIndex !== -1) {
        const randomNum = Math.floor(Math.random() * 1000); // Generate a random number
        newValue = `${newKey}_${randomNum}`;
        existingIndex = metaTemp.value.findIndex((value, idx) => value[0] === newValue && idx !== index);
    }

    // Update the key in the metaTemp array
    const updatedValue = [...metaTemp.value[index]];
    updatedValue[0] = newValue;
    metaTemp.value[index] = updatedValue;
}

const updateMetaValue = (index, newValue) => {
    // Ensure the existing array is modified in a reactive way
    const updatedEntry = [...metaTemp.value[index]];
    updatedEntry[1] = newValue; // Update the value
    metaTemp.value[index] = updatedEntry; // Assign the updated entry back
}


const removeMeta = (index) => {
    if (index > -1 && index < metaTemp.value.length) {
        metaTemp.value.splice(index, 1)
    }
}

const handleFileUploadSuccess = (newFile) => {
    fileUploadActive.value = false
    uploadFinished.value = true
    setTimeout(function(){
        uploadFinished.value = false
        emit('modalClosed', newFile.response ? newFile.response : undefined)
    }, 3000)
}

const handleFileUploadError = (newFile) => {
    fileUploadActive.value = false
    uploadFailed.value = true
    if (newFile.error){
        useToast().error(newFile.response.detail)
    }
}

const handleFileUploadStart = () => {
    fileUploadActive.value = true
    uploadFinished.value = false
}

watch(() => props.modalopen, (newValue) => {
    isOpen.value = newValue
    uploadFinished.value = false
})

watch(() => props.track, (newTrack) => {
    showSettings.value.track.meta_custom = false

    if (Object.keys(newTrack).length === 0) {
        trackEdit.value = false
        modalName.value = 'Add Media'
        track.value = {
            images: [],
            meta:  {
                title: ''
            },
            resource: {},
            track_type: "track",

        }
    } else {
        uploadFinished.value = false
        trackEdit.value = true
        modalName.value = 'Edit'
        track.value = JSON.parse(JSON.stringify(newTrack))

        metaTitleTemp.value = track.value.meta.title
        metaTemp.value = Object.keys(track.value.meta)
        // .filter(key => key !== "title") // Skip "meta.title"
        .map(key => {
            let value = track.value.meta[key];
            // Check if the value is an object and not null
            if (typeof value === "object" && value !== null) {
            // Convert object to string
            value = JSON.stringify(value);
            }
            return [key, value];
        })
    }
});

const saveMeta = () => {
    const metaObject = metaTemp.value.reduce((acc, [key, value]) => {
        // Check if the value is a string that could be a JSON object
        if (typeof value === "string" && value.startsWith('{') && value.endsWith('}')) {
            try {
            // Attempt to parse the string as JSON
            value = JSON.parse(value);
            } catch (e) {
            // If parsing fails, keep the value as is
            console.error("Parsing error:", e);
            }
        }
        // Assign the key-value pair to the accumulator object
        acc[key] = value;
        return acc;
    }, {});
    return metaObject
}

const saveTrack = async () => {
    track.value.meta = {}
    track.value.meta = saveMeta()
    track.value.meta.title = metaTitleTemp.value
    trackStore.trackTemp = track
    trackStore.saveTrack(false)
    await trackStore.fetchTracks()
    emit('modalClosed')
}

const newTrack = async () => {
    trackStore.trackTemp = track
    trackStore.saveTrack(true) 
    emit('modalClosed')
}

const closeModal = async () => {
    if(!fileUploadActive.value) {
        emit('modalClosed')
    }
}

const autoResize = (event) => {
    const element = event.target;
    element.style.height = 'auto'; // Temporarily shrink to auto to get the correct scrollHeight
    element.style.height = `${element.scrollHeight}px`; // Set the height to the scroll height
}

const beforeEnter = (el) => {
    el.style.height = '0';
}

const enter = (el) => {
    el.style.height = el.scrollHeight + 'px';
}

const afterEnter = (el) => {
    el.style.height = null;
}

const beforeLeave = (el) => {
    el.style.height = el.scrollHeight + 'px';
}

const leave = (el) => {
    el.style.height = '0';
}

const afterLeave = (el) => {
    el.style.height = null;
}
</script>

<template>
    <modal :open="isOpen" @update:open="closeModal" title="">
        <div class="flex gap-4 items-center mb-2 border-b dark:border-gray-800 pb-3">
            <div class="text-xl font-bold">
                <template v-if="!fileUploadActive">
                    {{ modalName }}
                </template>
                <template v-else>
                    Uploading
                </template>
            </div>
            <!--------------------------------------------- Type Selector ----------------------------------------------------->
            <div class="flex items-center ml-auto" v-if="!fileUploadActive">
                <select :disabled="trackEdit" v-model="track.track_type" class="px-2 py-0.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white font-medium focus:ring-npurple focus:border-npurple">
                    <option value="null" disabled hidden>Select a generator</option>
                    <option v-for="option in track_types" :key="option.id" :value="option.id">
                        {{ option.name }}
                    </option>
                </select>
            </div>
            <font-awesome-icon icon="x" class="float-right mt-1 cursor-pointer hover:text-ngreenhover" @click="closeModal" />
            <!-- <button
                class="top-2 ml-auto text-gray-400 cursor-pointer hover:text-gray-900"
                @click="closeModal()"
                v-if="!fileUploadActive"
            >
                <font-awesome-icon icon="x" />
            </button> -->
        </div>
        <div class="overflow-auto max-h-[80vh]" @click.stop>
            <div v-if="trackEdit">
                <!--------------------------------------------- Track --------------------------------------------------- -->
                <template v-if="track">
                    <div class="grid grid-cols-1 gap-2 mb-2 pt-4">
                        <div>
                            <div class="font-medium mb-1">Title</div>
                            <textarea v-model="metaTitleTemp" @input="autoResize" class="border p-2 rounded w-full resize-none overflow-hidden dark:border-gray-700 custom-textarea" rows="1"></textarea>
                        </div>
                    </div>
                    <div class="font-medium hover:text-ngreenhover cursor-pointer py-2 border-b dark:border-gray-700" @click="showSettings.track.meta_custom = !showSettings.track.meta_custom">
                        <svg class="h-4 w-4 float-right" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{'transform rotate-180': showSettings.track.meta_custom}">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <div>
                            Metadata
                        </div>
                    </div>
                    <transition name="expand" @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter" @before-leave="beforeLeave" @leave="leave" @after-leave="afterLeave">
                        <div v-if="showSettings.track.meta_custom">
                            <div class="mt-2">
                                <template  v-for="(value, index) in metaTemp" :key="index">
                                    <div class="my-4" v-if="value[0] !== 'title'">
                                        <div class="relative">
                                            <input type="text" :value="value[0]" @input="event => updateMetaKey(index, event.target.value)" class="border p-2 bg-transparent dark:border-gray-700 w-full custom-textarea font-bold" style="font-size: 12px;" />
                                            <button class="absolute right-0 hover:text-ngreenhover rounded p-1.5 px-2.5" @click="removeMeta(index)"><font-awesome-icon icon="x" size="xs" /></button>
                                        </div>
                                        <input type="text" :value="value[1]" @input="event => updateMetaValue(index, event.target.value)" class="border border-t-0 focus:border-t p-2 bg-ngreytransparent dark:border-gray-700 w-full custom-textarea" style="font-size: 12px;" />
                                    </div>
                                </template>
                            </div>
                            <button class="bg-npurple rounded-md text-white p-2 px-4 text-sm font-medium" @click="track_addmeta"><font-awesome-icon icon="plus" size="xs" /> Add meta</button>
                        </div>
                    </transition>
                </template>
            </div>
            <div v-if="!trackEdit">
                <template v-if="uploadFinished">
                    <div class="my-8 font-bold text-center">
                        <img src="/assets/done.gif" class="w-20 mx-auto mb-10" />
                        Upload Complete
                    </div>
                </template>
                <template v-else>
                    <template v-if="track.track_type === 'track'">
                        <div class="pt-2">
                            <Import accept="audio/*,application/zip,application/tar,application/gzip" extension="mp3,wav,aiff,flac,zip,tar,gz" @file-upload-start="handleFileUploadStart" @file-upload-success="handleFileUploadSuccess" @file-upload-error="handleFileUploadError" @file-upload-cancel="closeModal"></Import>
                        </div>
                    </template>
                    <template v-if="track.track_type === 'image'">
                        <div class="pt-2">
                            <Import accept="image/*" extension="gif,jpg,jpeg,png,webp" @file-upload-start="handleFileUploadStart"  @file-upload-success="handleFileUploadSuccess" @file-upload-error="handleFileUploadError" @file-upload-cancel="closeModal"></Import>
                        </div>
                    </template>
                    <template v-if="track.track_type === 'text'">
                        <div class="grid grid-cols-1 gap-2 mb-2">
                            <div>
                                <div class="label">Title</div>
                                <textarea v-model="track.meta.title" @input="autoResize"  class="border p-2 rounded w-full resize-none overflow-hidden dark:border-gray-700 custom-textarea" rows="1"></textarea>
                            </div>
                            <div>
                                <div class="label">Content</div>
                                <textarea v-model="track.meta.content" @input="autoResize"  class="border p-2 rounded w-full resize-none overflow-hidden dark:border-gray-700 custom-textarea" rows="6"></textarea>
                            </div>
                        </div>
                    </template>
                    <template v-if="track.track_type === 'website'">
                        <div class="grid grid-cols-1 gap-2 mb-2">
                            <div>
                                <div class="label">Title</div>
                                <textarea v-model="track.meta.title" @input="autoResize"  class="border p-2 rounded w-full resize-none overflow-hidden dark:border-gray-700 custom-textarea" rows="1"></textarea>
                            </div>
                            <div>
                                <div class="label">URL</div>
                                <textarea v-model="track.meta.url" @input="autoResize"  class="border p-2 rounded w-full resize-none overflow-hidden dark:border-gray-700 custom-textarea" rows="6"></textarea>
                            </div>
                        </div>
                    </template>
                </template>
            </div>
        </div>
        <div v-if="trackEdit">
            <button class="px-8 py-2 mt-6 text-md bg-npurple text-white font-medium rounded-lg focus:outline-none" @click="saveTrack">
                Save
            </button>
            <button class="float-right px-4 py-2 mt-6 text-md bg-gray-300 dark:bg-gray-800 hover:bg-npurple text-white font-medium rounded-lg focus:outline-none" @click="closeModal">
                Cancel
            </button>
        </div>
    </modal>
</template>
<style scoped>
.expand-enter-active, .expand-leave-active {
    transition: height 0.1s ease-in-out;
    overflow: hidden;
}
.label {
    font-weight: 500;
    margin-top: 5px;
    margin-bottom: 3px;
    font-size: 14px;
}
input, textarea {
    font-size: 14px;
}
textarea {
    transition: height 0.2s; /* Adjust time for a smoother or faster transition */
    background-color: transparent;
}
.custom-textarea:focus {
    outline: none;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5); /* Example for blue shadow */
    border-color: #2563eb; /* Example for blue border */
}
</style>