<script setup>
import { ref, watch } from 'vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useBrowserStore } from '@/stores/browser'
import { useTrackStore } from '@/stores/track'
import { useCollectionStore } from '@/stores/collection'
import { useAssetStore } from '@/stores/asset'
import { useRouter } from 'vue-router'
import Modal from '@/components/apps_components/component_modal.vue'

const trackStore = useTrackStore()
const collectionStore = useCollectionStore()
const assetStore = useAssetStore()

const browserStore = useBrowserStore()
const exportactive = ref('ready')

const props = defineProps({
    modalopen: {
        type: Boolean,
        required: true
    }
})
const emit = defineEmits(['modalClosed'])

const isOpen = ref(props.modalopen)

watch(() => props.modalopen, (newValue) => {
    isOpen.value = newValue;
})

watch(isOpen, (newValue) => {
    if (!newValue) {
        emit('modalClosed')
    }
})

const downloadFiles = async () => {
    if (browserStore.export.track != null) {
        const trackId = browserStore.export.track.id
        let track_name = `nendo_${trackId}`
        exportactive.value = 'processing'
        if ("original_filename" in trackStore.track.resource.meta){
            track_name = browserStore.export.track.resource.meta.original_filename
            track_name = track_name.substring(0, track_name.lastIndexOf('.')) || track_name
        }
        await assetStore.downloadTrack(trackId)
        const file = assetStore.downloadedTrack
        if (file) {
            saveAs(file, track_name + '.wav')
        }
        exportactive.value = 'done'
        setTimeout(() => {
            exportactive.value = 'ready'
            browserStore.export.modal = false
            isOpen.value = false
        }, 2000)
    } else if (browserStore.export.collection != null) {
        const collectionId = browserStore.export.collection.id
        exportactive.value = 'processing'
        await assetStore.downloadCollection(collectionId)
        const file = assetStore.downloadedCollection
        if (file) {
            saveAs(file, browserStore.export.collection.name.replace(" ", "_") + '.zip')
        }
        exportactive.value = 'done'
        setTimeout(() => {
            exportactive.value = 'ready'
            browserStore.export.modal = false
            isOpen.value = false
        }, 2000)
    } else if (browserStore.export.tracks != null) {
        const trackIds = []
        browserStore.export.tracks.forEach((track)=> {
            trackIds.push(track.id)
        })
        exportactive.value = 'processing'
        await assetStore.downloadTracks(trackIds)
        const file = assetStore.downloadedTracks
        if (file) {
            saveAs(file, browserStore.export.filename + '.zip')
        }
        exportactive.value = 'done'
        setTimeout(() => {
            exportactive.value = 'ready'
            browserStore.export.modal = false
            isOpen.value = false
        }, 2000)
    }
}
</script>

<template>
    <modal
        :open="isOpen"
        @update:open="isOpen = $event"
        title="Export"
    >
        <template v-if="exportactive === 'ready'">
            <div class="mt-4 font-medium border dark:border-gray-700 p-2 rounded-md flex">
                <div class="rounded-md px-4 py-2 cursor-pointer bg-gray-200 dark:bg-gray-800">
                    <template v-if="browserStore.export.track != null">
                        1 Track
                    </template>
                    <template v-if="browserStore.export.collection != null">
                        Collection "{{ browserStore.export.collection.name }}"
                    </template>
                    <template v-if="browserStore.export.tracks != null">
                        {{ browserStore.export.tracks.length }} Tracks
                    </template>
                </div>
            </div>
            <!-- <div class="mt-4 mx-2 font-bold">To destination</div> -->
            <button
                class="rounded-md bg-npurple hover:bg-ngreenhover p-2 px-4 font-bold mt-6"
                @click="downloadFiles"
            >
                Download
            </button>
        </template>
        <template v-if="exportactive === 'processing'">
            <div class="mt-8 font-bold text-center">
                <img
                    src="/assets/loading_spinner.webp"
                    class="w-24 mx-auto mb-10"
                />
                <template v-if="browserStore.export.track != null">
                    Preparing to download track...
                </template>
                <template v-if="browserStore.export.collection != null">
                    Preparing to download collection...
                </template>
                <template v-if="browserStore.export.tracks != null">
                    Preparing to download tracks...
                </template>
            </div>
        </template>
        <template v-if="exportactive === 'done'">
            <div class="mt-8 font-bold text-center">
                <img src="/assets/done.gif" class="w-20 mx-auto mb-10" />
                Download Complete
            </div>
        </template>
    </modal>
</template>
