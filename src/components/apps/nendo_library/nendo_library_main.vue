<script setup>
// component imports
import AudioPlayer from '@/components/apps_components/component_player.vue'
import DropDown from '@/components/apps_components/component_dropdown.vue'
import Modal from '@/components/apps_components/component_modal.vue'
import Collection from '@/components/apps_components/component_collection.vue'
import Tools from '@/components/apps_components/component_tools.vue'
import Exporter from '@/components/apps_components/component_exporter.vue'
import TrackCreation from '@/components/apps_components/component_trackcreation.vue'
import TrackTranscription from '@/components/apps/nendo_library/nendo_library_transcription.vue'
import TrackDetails from '@/components/apps/nendo_library/nendo_library_trackdetails.vue'
import Filters from '@/components/apps/nendo_library/nendo_library_filters.vue'

// vue imports
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { debounce } from 'lodash'
import { useToast } from 'vue-toast-notification'

// router
const router = useRouter()
const route = useRoute()

// stores imports
import { useTrackStore } from '@/stores/track.js'
import { useBrowserStore } from '@/stores/browser.js'
import { useFilterStore } from '@/stores/filters.js'
import { useCollectionStore } from '@/stores/collection.js'

const trackStore = useTrackStore()
const browserStore = useBrowserStore()
const filterStore = useFilterStore()
const collectionStore = useCollectionStore()

// refs
const BASE_API_URL = import.meta.env.VITE_API_URL
const collectionModalRef = ref(null);
const collectionTrack = ref({})
const trackCreationModal = ref(false)
const trackCreationTrack = ref({})
const searchText = ref('')
const searchSimilarityTrack = ref({})
const currentTrackUrl = ref('')
const currentTrack = ref({})
const audioPlayerRef = ref(null)
const scrollComponent = ref(null)
const isLoading = ref(false)
const selectedTracks = ref([])
const collectionSelector = ref({ options: [], collectionSelected: [] })
const exporterShow = ref(false)
const filters = ref(false)
const filtersettings = ref([])
const searchResultTableRowsConfigModal = ref(false)
const bulkContextMenu = ref(false)
const searchResultDisplayType = ref('list')
const lastVisitedId = ref('')
const trackTypeSettings = ref({
    'options':[
        {key:'All Media', value: 'all'}, 
        {key:'Audio: Track', value: 'track'}, 
        {key:'Audio: Stem', value: 'stem'}, 
        {key:'Audio: Loop', value: 'loop'}
    ], 
    'value': 'all'
})
const searchResultTableRows = ref({
    options: [
        {name:'Type', type: 'meta'}, 
        {name:'Duration', type: 'meta'},
        {name:'Artist', type: 'meta'},
        {name:'Album', type: 'meta'},
        {name:'Spectrogram', type: 'meta'},
        {name:'Key', plugin:'nendo_plugin_classify_core', key: 'key', type: 'plugin'},
        {name:'Scale', plugin:'nendo_plugin_classify_core', key: 'scale', type: 'plugin'},
        {name:'Tempo', plugin:'nendo_plugin_classify_core', key: 'tempo', type: 'plugin'},
        {name:'Genres', plugin:'nendo_plugin_classify_core', key: 'genres', type: 'plugin'}, 
        {name:'Moods', plugin:'nendo_plugin_classify_core', key: 'moods', type: 'plugin'}, 
        {name:'Instruments', plugin:'nendo_plugin_classify_core', key: 'instruments', type: 'plugin'}, 
        {name:'SFX', plugin:'nendo_plugin_classify_core', key: 'sfx', type: 'plugin'},
        {name:'Caption', plugin:'nendo_plugin_caption_lpmusiccaps', key: 'caption', type: 'plugin'},
        {name:'Transcription', plugin:'nendo_plugin_transcribe_whisper', key: 'transcription', type: 'plugin'},
        {name:'Summary', plugin:'nendo_plugin_textgen', key: 'summary', type: 'plugin'}, 
        {name:'Sentiment', plugin:'nendo_plugin_textgen', key: 'sentiment_analysis', type: 'plugin'}, 
        {name:'Topics', plugin:'nendo_plugin_textgen', key: 'topic_detection', type: 'plugin'},
    ],
    optionsSelected: []
})

// Mount
onMounted(async () => {
    document.addEventListener('keydown', handleKeyPress)
    await getTracks()
    if (scrollComponent.value) {
        scrollComponent.value.addEventListener("scroll", getTracksScroll)
    }
    getTableRowFromStore()
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyPress);
    if (scrollComponent.value) {
        scrollComponent.value.removeEventListener("scroll", getTracksScroll);
    }
    if (audioPlayerRef.value) {
        audioPlayerRef.value.destroyPlayer();
    }
})

// Watch Route
watch(
    () => route.fullPath,
    (to, from) => {
        resetSearchInput()
    }
)

// Watch track type selector
watch(() => trackTypeSettings.value.value, async (newValue) => {
    await getTracks()
})

// Watch similar search
watch(() => searchSimilarityTrack.value.value, async (newValue) => {
    if (router.currentRoute.value.name === 'track' && newValue !== undefined) {
        gotoLibrary()
    }
    await getTracks()
})

// Watch filtersettings
watch(() => filtersettings.value, async (newValue) => {
    applyFilter()
},
{ deep: true })

// Search result rows
function searchResultTableRowsConfigModalShow() {
    searchResultTableRowsConfigModal.value = !searchResultTableRowsConfigModal.value
}
function isFilterSelected(filter) {
    return searchResultTableRows.value.optionsSelected.some(selected => selected.name === filter.name);
}

function isPlayableTrack(track) {
    return track.track_type !== 'text' && track.track_type !== 'website' && track.track_type !== 'image'
}

function getTableRowFromStore() {
    const viewwData = JSON.parse(localStorage.getItem(router.currentRoute.value.params.id))
    if (viewwData !== null) {
        searchResultTableRows.value.optionsSelected = viewwData
    } else {
        searchResultTableRows.value.optionsSelected =  []
    }
}

function searchResultTableRowsConfigModalToggle(index) {
    const filterOption = searchResultTableRows.value.options[index];
    const selectedIndex = searchResultTableRows.value.optionsSelected.findIndex(
        (option) => option.name === filterOption.name
    )
    if (selectedIndex === -1) {
        searchResultTableRows.value.optionsSelected.push(filterOption);
    } else {
        searchResultTableRows.value.optionsSelected.splice(selectedIndex, 1);
    }
    // save view settings to local store
    if(router.currentRoute.value.name !== 'track') {
        localStorage.setItem(router.currentRoute.value.params.id, JSON.stringify(searchResultTableRows.value.optionsSelected))
    }
}

// Filters
const filterOpen = (index) => {
    filters.value = !filters.value
    window.scrollTo({
        top: 0
    })
}

function handleUpdateFilter(updatedFilters) {
  filtersettings.value = updatedFilters
}

const applyFilter = debounce(() => {
	filterStore.selectedFilters = filtersettings.value
    getTracks()
}, 300)

// Collections
const collectionModalClose = async (data) => {
    browserStore.collectionModal = false
    if (data.collection.value.collectionSelected[0]) {
        if (!data.addTrack.value && data.collection.value.collectionSelected[0].id) {
            if(data.collection.value.collectionSelected.length){
                router.push({ path: '/collection/' + data.collection.value.collectionSelected[0].id })
            } else {
                router.push({ path: '/library/' })
            }
        }
    } else {
        router.push({ path: '/library/' })
    }
    if(data.addTrack.value && data.track.value !== 'bulk' && data.track.value !== 'selection') {
        await trackStore.fetchTrack(data.track.value.id)
        // update track on collection assign
        if (router.currentRoute.value.name === 'library' || router.currentRoute.value.name === 'collection') { 
            let trackIndex = trackStore.tracks.findIndex(
                (option) => option.id === data.track.value.id
            )
            trackStore.tracks[trackIndex] = JSON.parse(JSON.stringify(trackStore.track))
        }
    }
    if (router.currentRoute.value.name === 'collection'){
        await collectionStore.fetchCollection(route.params.id)
        collectionSelector.value.collectionSelected = [collectionStore.collection]
        await getTracks()
    }
}

function collectionModalCloseCall() {
    if (collectionModalRef.value) {
        collectionModalRef.value.closeModalParent()
    }
}


// Track creation modal
const trackCreationModalClose = async (response) => {
    trackCreationModal.value = false
    if (response && response.action_id){
        useToast().success('Action created successfully.')
    }
    if (response && response.result_id) {
        if (response.result_id.startsWith('collection')){
            router.push({ path: '/' + response.result_id })
            await getTracks()
        } else {
            router.push({ path: '/library/' + response.result_id })
        }
    } else {
        router.push({ path: '/library/'})
        await getTracks()
    }
}



// Row Display
const showTrackTitleWithFallback = (track, index) => {
    if (track.meta && track.meta.title){ 
        return track.meta.title
    }
    if (track.resource && track.resource.meta && track.resource.meta.title){
        return track.resource.meta.title
    }
    if (track.resource && track.resource.meta && track.resource.meta.original_filename){
        return track.resource.meta.original_filename
    }
    return `Track ${index}`
}

// const trackDetailsToggle = (track)  => {
//     track.isOpen = !track.isOpen
// }

// Track selection
const trackDetailsToggle = (track, event) => {
    event.stopPropagation()

    if (event.shiftKey) {
        const index = selectedTracks.value.findIndex(tid => tid === track.id);
        if (index === -1) {
            selectedTracks.value.push(track.id);
        } else {
            selectedTracks.value.splice(index, 1);
        }
    } else {
        selectedTracks.value = []
        track.isOpen = !track.isOpen
        // trackStore.tracks[index].isOpen = !trackStore.tracks[index].isOpen;
    }
}

const isTrackSelected = computed(() => {
    return (trackId) => selectedTracks.value.includes(trackId);
})


// Audio Playback
function track_play(track) {
    if (track.track_type === "text" || track.track_type === "image" || track.track_type === "website"){
        return
    }
    if (track.id !== currentTrack.value.id) {
        currentTrack.value.isPlaying = false
    }
    currentTrack.value = track
    currentTrackUrl.value = `${BASE_API_URL}/api/v1/assets/audio/${track.id}`
    if (audioPlayerRef.value) {
        audioPlayerRef.value.togglePlayPause();
    }
}

const handleAudioPlayed = (playedTrackId) => {
    currentTrack.value.isPlaying = !currentTrack.value.isPlaying
}

const currentTrackPlaybackTime = ref(0)
const currentTrackPlaybackTotalTime = ref(0)

const handleAudioTime = (time) => {
    currentTrackPlaybackTime.value = parseInt(time.trackCurrentTime)
    currentTrackPlaybackTotalTime.value = time.trackTotalTime
}

const progress = computed(() => {
    return (currentTrackPlaybackTime.value / currentTrackPlaybackTotalTime.value) * 100;
})

const seekAudio = (event, track) => {
    if (track.id === currentTrack.value.id) {
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const width = rect.width
        const clickPositionRatio = clickX / width
        const seekTime = currentTrackPlaybackTotalTime.value * clickPositionRatio
        browserStore.audioPlayerSeek = seekTime
    } else {
        track_play(track)
    }
}

// Utility
function contextMenuClose(track) {
    if (track) {
        track.contextMenu = false; 
    }
    if (trackStore.track) {
        trackStore.track.contextMenu = false
    }
}

function formatDuration(time) {
    if (!time) {
        return '';
    }
    // Round the time to the nearest whole number
    time = Math.round(time);

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    let formattedTime = '';
    if (hours > 0) {
        formattedTime += `${hours}:`;
    }
    formattedTime += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
}

const addFilter = (filter) => {
    const newFilter = {
        field: {
            value: filter,
        },
        query: filter,
    }
    const filterindex = filtersettings.value.findIndex(f => f.query.name === filter.name)
    if (filterindex > -1){
        filtersettings.value.splice(filterindex, 1)
    }
    filtersettings.value.push(newFilter)
    filters.value = true
}

const gotoLibrary = () => {
    router.push({ path: '/library/' })
}

const gotoTrack = (track) => {
    router.push({ path: '/library/' + track.id })
}

const downloadTrack = (track) => {
    browserStore.export.track = track
    browserStore.export.collection = null
    exporterShow.value = true
}

const downloadCollection = (collection) => {
    browserStore.export.track = null
    browserStore.export.collection = collection
    exporterShow.value = true
}

function getTrackImage(track, spectrogram = true) {
    if (track && track.images) {
        let coverImage
        coverImage = track.images.find(
            (image) => (image.meta.image_type === 'cover')
        )
        // backup to cover image: spectrogram
        if (!coverImage && spectrogram) {
            coverImage = track.images.find(
                (image) => (image.meta.image_type === 'spectrogram')
            )
        }
        if (coverImage && coverImage.file_name.length > 0) {
            return '/api/assets/image/' + coverImage.file_name 
        }
    }

    // backup to album cover and spectrogram: placeholder
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode) { 
        return '/assets/cover_placeholder_dark.webp'
    }
    return '/assets/cover_placeholder.webp'
}

function getTrackSpectrogram(track) {
    if (track && track.images) {
        let coverImage = track.images.find(
            (image) => (image.meta.image_type === 'spectrogram')
        )
        if (coverImage && coverImage.file_name.length > 0) {
            return '/api/assets/image/' + coverImage.file_name 
        }
    }
    return false
}

const handleKeyPress = (event) => {
    const SCROLL_AMOUNT = 50; // Amount to scroll on arrow key press
    if (scrollComponent.value) {
        if (event.key === 'ArrowUp') {
            if (event.ctrlKey) {
                // Scroll to the top
                scrollComponent.value.scrollTop = 0;
            } else {
                // Scroll up
                scrollComponent.value.scrollTop -= SCROLL_AMOUNT
            }
        } else if (event.key === 'ArrowDown') {
            if (event.ctrlKey) {
                // Scroll to the bottom
                scrollComponent.value.scrollTop = scrollComponent.value.scrollHeight
            } else {
                // Scroll down
                scrollComponent.value.scrollTop += SCROLL_AMOUNT
            }
        }
    }
}

// Search
const handleSearchInput = debounce((event) => {
    searchText.value = event.target.value
    filterStore.search = searchText.value
    getTracks()
}, 300)

const resetSearchInput = () => {
    searchText.value = ''
    filterStore.search = ''
    getTracks()
}

// Data handling
const getPluginData = (plugin_data, fieldName = null, keyValue = null) => {
    return plugin_data.filter(data => {
        const nameMatch = fieldName ? data.plugin_name === fieldName : true;
        const keyMatch = keyValue ? data.key === keyValue : true;
        return nameMatch && keyMatch;
    });
}

const deleteTrack = async (track) => {
    let text = "Delete Track?"
    if (confirm(text) == true) {
        const result = await trackStore.deleteTrack(track.id)
        if (router.currentRoute.value.name === 'track') { 
            gotoLibrary()
        } else {
            const deletedTrackId = trackStore.tracks.findIndex(
                (option) => option.id === track.id
            )
            if (deletedTrackId !== -1) {
                trackStore.tracks.splice(deletedTrackId, 1);
                if (router.currentRoute.value.name === 'collection'){
                    await collectionStore.fetchCollection(route.params.id)
                    collectionSelector.value.collectionSelected = [collectionStore.collection]
                }
            } else {
                await getTracks()
            }
        }
    } 
}

const editTrack = async (track) => {
    trackCreationTrack.value = track
    trackCreationModal.value = true
}

const newTrack = async (track) => {
    trackCreationTrack.value = {}
    trackCreationModal.value = true
}

// Bulk processing
const bulkDelete = async () => {
    let text = `Delete all Tracks${router.currentRoute.value.name === 'collection' ? ' in this collection' : ''}?`
    if (confirm(text) == true) {
        bulkContextMenu.value = false
        await trackStore.deleteTracks({
            collection_id: router.currentRoute.value.name === 'collection' ? route.params.id : "",
            track_type: trackTypeSettings.value.value
        })
        if (router.currentRoute.value.name === 'collection'){
            await collectionStore.fetchCollection(route.params.id)
            collectionSelector.value.collectionSelected = [collectionStore.collection]
        }
        getTracks()
    }
}

const selectionDelete = async () => {
    let text = `Delete all selected Tracks${router.currentRoute.value.name === 'collection' ? ' in this collection' : ''}?`
    if (confirm(text) == true) {
        bulkContextMenu.value = false
        await trackStore.deleteSelectedTracks(selectedTracks.value)
        if (router.currentRoute.value.name === 'collection'){
            await collectionStore.fetchCollection(route.params.id)
            collectionSelector.value.collectionSelected = [collectionStore.collection]
        }
        getTracks()
    }
}

// Paginate Infinite scroll
const getTracksScroll = async () => {
    let element = scrollComponent.value;
    if (element) {
        let isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 400;
        if (isAtBottom && !isLoading.value && trackStore.$state.hasNext) {
            isLoading.value = true;
            trackStore.$state.cursor = trackStore.$state.cursor + 1

            if (router.currentRoute.value.name === 'library') {
                await trackStore.fetchTracks({
                    append: true,
                    reset_paging: false,
                    track_type: trackTypeSettings.value.value
                })
            }
            if (router.currentRoute.value.name === 'collection') { 
                await trackStore.fetchTracks({
                    append: true,
                    collection_id: route.params.id,
                    reset_paging: false,
                    track_type: trackTypeSettings.value.value,
                })
            }
            if (router.currentRoute.value.name === 'track') {
                await trackStore.fetchTracks({
                    append: true,
                    fetch_related: true,
                    track_id: route.params.id,
                    reset_paging: false,
                    track_type: trackTypeSettings.value.value,
                })
            }
            isLoading.value = false;
        }
    }
}

async function getTracks() {
    const similarTo = (
        searchSimilarityTrack.value.value !== undefined ?
        searchSimilarityTrack.value.value.id : null
    )
    if (router.currentRoute.value.name === 'track') {
        collectionStore.collection = []
        collectionSelector.value.collectionSelected = []
        if (lastVisitedId.value !== route.params.id) {
            await trackStore.fetchTrack(route.params.id)
            lastVisitedId.value = route.params.id
        }
        // get related tracks
        await trackStore.fetchTracks({
            fetch_related: true,
            track_id: route.params.id,
            track_type: trackTypeSettings.value.value,
            reset_paging: true
        })
    }
    if (router.currentRoute.value.name === 'library') {
        collectionStore.collection = []
        collectionSelector.value.collectionSelected = []
        await trackStore.fetchTracks({
            similarTo: similarTo,
            reset_paging: true,
            track_type: trackTypeSettings.value.value
        })
        lastVisitedId.value = ''
    }
    if (router.currentRoute.value.name === 'collection') {
        if (lastVisitedId.value !== route.params.id) {
            await collectionStore.fetchCollection(route.params.id)
            lastVisitedId.value = route.params.id
        }
        collectionSelector.value.collectionSelected = [collectionStore.collection]
        await trackStore.fetchTracks({
            similarTo: similarTo,
            collection_id: route.params.id,
            track_type: trackTypeSettings.value.value,
            reset_paging: true
        })
    }

    await getTracksScroll()

    // TEST DATA
    const useFakeData = false
    if(useFakeData) {
        const metafake = [
            {
                "track_id": "4a34f62a-bc9c-4267-90f4-9184d80c5341",
                "user_id": "085df796-cb6b-4251-9d17-758c720114e5",
                "plugin_name": "nendo_plugin_transcribe_whisper",
                "plugin_version": "0.2.4",
                "key": "transcription",
                "value": "[00:00-00:05]: Retractable walls are a great architectural solution to space problems and more.\n[00:05-00:15]: There are so many ways to use them, you might as well create your own transforming smart house of the future with just a couple of those.\n[00:15-00:22]: Architects and designers often face various issues and challenges that have to do with difficult\n[00:22-00:25]: layouts, the lack of space and clients various\n[00:25-00:32]: wants and needs. And retractable walls are great at solving a lot of them. In\n[00:32-00:36]: small spaces, retractable walls help create\n[00:36-00:41]: private spaces as well as allowing for open layouts that visually enhance\n[00:41-00:48]: interiors. In big houses, the moving walls can marry indoors and outdoors\n[00:48-00:56]: blurring the line between the comfort of a habitat and closeness of nature.",
                "id": "b8926758-1c27-4518-b75f-2575c1177a41",
                "created_at": "2024-01-22T22:17:45.558988Z",
                "updated_at": "2024-01-22T22:17:45.558988Z"
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_textgen',
                'plugin_version': '0.1.0',
                'key': 'entity_detection',
                'value': '<p><b>person_name</b><p><p>Romulus, Remus, Julius Caesar, Octavian, Nero, Constantine I</p><p><b>organization</b></p><p>Roman Empire, Roman Empire</p>',
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_textgen',
                'plugin_version': '0.1.0',
                'key': 'sentiment_analysis',
                'value': 'lorem ipsum …',
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_textgen',
                'plugin_version': '0.1.0',
                'key': 'summarization',
                'value': 'lorem ipsum …',
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_textgen',
                'plugin_version': '0.1.0',
                'key': 'topic_detection',
                'value': 'Europe Travel\nChristianity\nRail Travel\nPolitics',
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_classify_core',
                'plugin_version': '0.1.0',
                'key': 'BPM',
                'value': '120',
            },
            {
                'id': '085df796-cb6b-4251-9d17-758c720114e5',
                'plugin_name': 'nendo_plugin_classify_core',
                'plugin_version': '0.1.0',
                'key': 'Key',
                'value': 'C#',
            }
        ]
        if(trackStore.tracks){
            for(let i=0; i< trackStore.tracks.length; i++) {
                trackStore.tracks[i]['plugin_data'] = metafake
            }
        }
        trackStore.track.plugin_data = metafake
    }
}

function onDragStart($event, track) {
    if (selectedTracks.value.length === 0) {
        browserStore.draggableTracks = [track.id]
    } else {
        browserStore.draggableTracks = selectedTracks.value
    }
}

</script>

<template>
    <div class="flex flex-col h-screen text-gray-800 dark:text-white bg-white dark:bg-ngreyblack">
        <div class="h-[62px] flex p-3 px-4 z-40 w-full border-b dark:border-b-4 dark:border-black bg-white dark:bg-ngreyblack">
            <div class="text-2xl font-bold items-center cursor-pointer whitespace-nowrap mr-6 flex" v-if="!browserStore.sidebarActive">
                <font-awesome-icon icon="bars" class="ml-3.5 mr-0 md:mr-3.5 text-gray-500 hover:text-ngreenhover" @click="browserStore.sidebarActive = !browserStore.sidebarActive" />
                <router-link to="/library" class="mobilehide">
                    <img class="h-[20px] min-w-[135px] mx-3 mt-[-4px]" src="/assets/nendo_logo.png" />
                </router-link>
            </div>

            <div class="flex w-full gap-2">
                <div class="px-3 pt-1.5 text-sm whitespace-nowrap border border-gray-300 rounded-md dark:border-gray-700 flex font-medium cursor-pointer" v-if="searchSimilarityTrack.value">
                    <div class="mr-1 font-bold">Similar to:</div>
                    <div class="font-medium hover:underline inline-block truncate w-20" @click="gotoTrack(searchSimilarityTrack.value)" @click.stop :title="showTrackTitleWithFallback(searchSimilarityTrack.value, 0)">
                        {{ showTrackTitleWithFallback(searchSimilarityTrack.value, 0) }}
                    </div>
                    <font-awesome-icon icon="x" class="cursor-pointer mt-1 ml-2 text-gray-500 hover:text-npurple" @click="searchSimilarityTrack = {}" />
                </div>

                <div class="w-[40%] min-w-[140px]">
                    <div class="mx-auto rounded-md border dark:border-0 border-gray-300 overflow-hidden bg-white dark:bg-ngreytransparent text-sm">
                        <div class="relative flex items-center">
                            <span class="absolute left-2 pl-2">
                                <font-awesome-icon icon="magnifying-glass" class="text-gray-500" />
                            </span>
                            <input
                                type="search"
                                v-model="searchText"
                                class="form-control relative flex-auto min-w-0 block w-full pl-12 pr-10 py-[6px] font-medium text-gray-700 dark:text-gray-200 bg-transparent bg-clip-padding border-0 m-0 focus:text-gray-700 focus:outline outline-gray-300 dark:outline-gray-300 rounded-md"
                                placeholder="Search"
                                aria-label="Search"
                                aria-describedby="button-addon2"
                                @input="handleSearchInput"
                            />
                            <span v-if="searchText" class="absolute right-2 pr-2 cursor-pointer" @click="resetSearchInput()">
                                <font-awesome-icon icon="x" class="text-gray-500" />
                            </span>
                        </div>
                    </div>
                </div>

                <DropDown
                    :setting="trackTypeSettings"
                    @update="(val) => (trackTypeSettings.value = val)"
                    class="text-sm"
                />
                <button 
                    class="px-3 text-sm border border-gray-300 dark:border-gray-700 font-medium rounded-lg focus:outline-none"
                    @click="filterOpen()"
                >   
                    <font-awesome-icon icon="filter" class="text-gray-400 dark:text-gray-500" :class="{'text-gray-800 dark:text-white': filters}" />
                    <span class="mobilehide mx-1">
                        Filter
                        <svg v-if="filters" :class="{'transform rotate-180': filters}" class="h-4 w-4 mt-0.5 float-right" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </button>
                <div class="ml-auto flex gap-2">
                    <button class="px-4 text-sm border hover:border-ngreenhover hover:text-ngreenhover border-gray-300 dark:border-gray-700 dark:hover:border-ngreenhover font-medium rounded-lg focus:outline-none whitespace-nowrap" @click="newTrack">
                        <font-awesome-icon icon="plus" />
                        <span class="mobilehide ml-1">Add Media</span>
                    </button>
                </div>
            </div>
        </div>
        <div v-if="filters" class="border-b dark:border-b dark:border-black">   
            <Filters :filtersettings="filtersettings" @updateFilters="handleUpdateFilter"></Filters>
        </div>
        <template v-if="router.currentRoute.value.name === 'track' && trackStore.track">
            <div class="p-4 pt-3 text-sm h-[44px] dark:h-[45px] bg-gradient-to-b from-gray-100 dark:from-ngreyblackhover border-b dark:border-black flex font-bold capitalize">
                <font-awesome-icon @click="gotoLibrary" icon="arrow-left" size="xl" class="ml-3 mr-6 cursor-pointer hover:text-ngreenhover" />
                {{ trackStore.track.track_type }}
            </div>
        </template>
        <!-- <template v-if="router.currentRoute.value.name === 'collection'">
            <div class="px-4 items-center h-[44px] dark:h-[45px] text-sm bg-gradient-to-b from-gray-100 dark:from-ngreyblackhover border-b dark:border-black flex font-bold">
                <div v-for="(collection, index) in collectionSelector.collectionSelected" :key="index" class="flex w-full">
                    <font-awesome-icon @click="gotoLibrary" icon="arrow-left" size="xl" class="ml-3 mr-6 cursor-pointer hover:text-ngreenhover" />
                    {{ collection.name }} {{ collection.size > 0 ? `(${collection.size} tracks)` : '' }}
                    <div class="flex gap-2 ml-auto">
                        <div @click="browserStore.collectionModalEdit = collection; browserStore.collectionModal = true;" @click.stop class="text-sm rounded-md px-2 items-center hover:text-npurple cursor-pointer font-medium">
                            <font-awesome-icon icon="pen" />
                            <span class="ml-2 mobilehide">Edit</span>
                        </div>
                        <div @click="downloadCollection(collection)" @click.stop class="text-sm rounded-md px-2 items-center hover:text-npurple cursor-pointer font-medium">
                            <font-awesome-icon icon="download" />
                            <span class="ml-2 mobilehide">Export</span>
                        </div>
                    </div>
                </div>
            </div>
        </template> -->
        <template v-if="router.currentRoute.value.name === 'library' || router.currentRoute.value.name === 'collection'">
            <div class="px-4 py-1.5 pb-2 text-sm h-[44px] dark:h-[45px] bg-gradient-to-b from-gray-100 dark:from-ngreyblackhover border-b dark:border-black flex font-bold">
                <div class="flex gap-2 w-full">
                    <div class="w-full">
                        <div class="mr-auto py-1.5" v-if="router.currentRoute.value.name === 'library'">
                            <template v-if="!selectedTracks.length"> 
                                {{ trackStore.num_results }} Results
                            </template>
                            <template v-else>
                                {{ selectedTracks.length }} selected
                            </template>
                        </div>
                        <template v-if="router.currentRoute.value.name === 'collection'">
                            <div v-for="(collection, index) in collectionSelector.collectionSelected" :key="index" class="flex w-full">
                                <div class="py-1">
                                    <font-awesome-icon @click="gotoLibrary" icon="arrow-left" size="xl" class="ml-3 mr-6 cursor-pointer hover:text-ngreenhover" />
                                    {{ collection.name }} {{ collection.size > 0 ? `(${collection.size} tracks)` : '' }}
                                </div>
                                <div class="flex gap-2 ml-auto">
                                    <button @click="browserStore.collectionModalEdit = collection; browserStore.collectionModal = true;" @click.stop class="whitespace-nowrap text-xs font-medium border dark:border-gray-700 hover:border-npurple rounded-md cursor-pointer px-3 py-1 text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100">
                                        <font-awesome-icon icon="pen" />
                                        <span class="ml-2 mobilehide">Edit</span>
                                    </button>
                                    <button @click="downloadCollection(collection)" class="whitespace-nowrap text-xs font-medium border dark:border-gray-700 hover:border-npurple rounded-md cursor-pointer px-3 py-1 text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100" @click.stop>
                                        <font-awesome-icon icon="download" />
                                        <span class="ml-2 mobilehide">Export</span>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                    <template v-if="selectedTracks.length === 0"> 
                        <button @click="bulkContextMenu = !bulkContextMenu" class="whitespace-nowrap text-xs font-medium border dark:border-gray-700 hover:border-npurple rounded-md cursor-pointer px-3 py-1 text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100" @click.stop>
                            <font-awesome-icon icon="pen" class="mr-1" />
                            Edit all
                        </button>
                        <div v-show="bulkContextMenu" @click="bulkContextMenu = false" @click.stop class="group-hover:visible origin-top-right absolute right-4 mt-8 w-56 p-1 rounded-md shadow-lg bg-gray-100 dark:bg-[#282828] ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded cursor-pointer" @click="bulkDelete()"><div class="w-6"><font-awesome-icon icon="x" class="mt-0.5" /></div>Delete All</div>
                            <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded cursor-pointer" @click="collectionTrack.value = 'bulk'; browserStore.collectionModal = true; bulkContextMenu = false"><div class="w-6"><font-awesome-icon icon="bars" class="mt-0.5" /></div>Add all to collection</div>
                        </div>
                    </template>
                    <template v-else> 
                        <button @click="bulkContextMenu = !bulkContextMenu" class="whitespace-nowrap text-xs font-medium border dark:border-gray-700 hover:border-npurple rounded-md cursor-pointer px-3 py-1 text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100" @click.stop>
                            <font-awesome-icon icon="pen" class="mr-1" />
                            Edit selected
                        </button>
                        <div v-show="bulkContextMenu" @click="bulkContextMenu = false" @click.stop class="group-hover:visible origin-top-right absolute right-4 mt-8 w-56 p-1 rounded-md shadow-lg bg-gray-100 dark:bg-[#282828] ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded cursor-pointer" @click="selectionDelete()"><div class="w-6"><font-awesome-icon icon="x" class="mt-0.5" /></div>Delete selection</div>
                            <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded cursor-pointer" @click="collectionTrack.value = 'selection'; browserStore.collectionModal = true; bulkContextMenu = false"><div class="w-6"><font-awesome-icon icon="bars" class="mt-0.5" /></div>Add selected to collection</div>
                        </div>
                    </template>
                    <button @click="searchResultTableRowsConfigModalShow()" class="whitespace-nowrap text-xs font-medium border dark:border-gray-700 hover:border-npurple rounded-md cursor-pointer px-3 py-1 text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100" @click.stop>
                        <font-awesome-icon icon="table-columns" class="mr-1" />
                        Display
                    </button>
                </div>
            </div>
        </template>
        <div class="flex-1 overflow-auto" @click="trackStore.track.contextMenu = false" ref="scrollComponent">
            <template v-if="router.currentRoute.value.name === 'track' && trackStore.track">
                <div class="flex p-4 gap-4 items-center group">
                    <div 
                        class="h-[85px] w-[85px] min-h-[85px] min-w-[85px] rounded bg-cover relative cursor-pointer"
                        :style="`background-image: url(${getTrackImage(trackStore.track, false)})`"
                        @click="track_play(trackStore.track)" @click.stop
                    >
                        <div class="text-center pt-[30px] top-0 left-0 w-full h-full group-hover:bg-[rgba(0,0,0,0.6)] text-white rounded" :class="{'bg-[rgba(0,0,0,0.6)]': trackStore.track.id === currentTrack.id && currentTrack.isPlaying}">
                            <template v-if="isPlayableTrack(trackStore.track)">
                                <template v-if="trackStore.track.id === currentTrack.id && currentTrack.isPlaying">
                                    <img
                                        src="/assets/equaliser-animated-green.gif"
                                        width="15"
                                        height="15"
                                        class="cursor-pointer group-hover:hidden inline-block"
                                    />
                                    <font-awesome-icon
                                        icon="pause"
                                        size="lg"
                                        class="cursor-pointer hidden group-hover:inline-block"
                                    />
                                </template>
                                <template v-else>
                                    <font-awesome-icon
                                        icon="play"
                                        size="lg"
                                        class="cursor-pointer hidden group-hover:inline-block ml-1"
                                    />
                                </template>
                            </template>
                        </div>
                    </div>
                    <div>
                        <div class="text-md md:text-3xl font-bold mb-1 md:mb-2">{{ showTrackTitleWithFallback(trackStore.track, 0) }}</div>
                        <div v-if="trackStore.track.meta && trackStore.track.meta.artist" class="text-sm md:text-md text-gray-500 dark:text-gray-400 inline-block">
                            {{ trackStore.track.meta.artist }}
                            <template v-if="trackStore.track.meta.duration">
                                - {{ formatDuration(trackStore.track.meta.duration) }}
                            </template>
                        </div>
                    </div>
                    <div class="ml-auto flex items-center mt-3.5">
                        <div class="flex items-center mr-6 gap-6">
                            <button @click="trackStore.track.contextMenu = !trackStore.track.contextMenu" class="cursor-pointer px-2 text-gray-600 dark:hover:text-gray-100" @click.stop>
                                <font-awesome-icon icon="ellipsis-vertical" size="xl" />
                            </button>
                        </div>
                    </div>
                    <div v-show="trackStore.track.contextMenu" @click="trackStore.track.contextMenu = false" @click.stop class="text-sm origin-top-right absolute cursor-pointer right-5 mt-[210px] w-56 p-1 rounded-md shadow-lg bg-gray-100 dark:bg-[#282828] ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="collectionTrack.value = trackStore.track; browserStore.collectionModal = true; trackStore.track.contextMenu = false" @click.stop><div class="w-6"><font-awesome-icon icon="plus" class="mt-0.5" /></div> Add to collection</div>
                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="searchSimilarityTrack.value = trackStore.track"><div class="w-6"><font-awesome-icon icon="bars" class="mt-0.5" /></div>Find similar</div>
                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="downloadTrack(trackStore.track)"><div class="w-6"><font-awesome-icon icon="download" class="mt-0.5" /></div>Download</div>
                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="editTrack(trackStore.track); trackStore.track.contextMenu = false"><div class="w-6"><font-awesome-icon icon="pen" class="mt-0.5" /></div>Edit</div>
                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="deleteTrack(trackStore.track); trackStore.track.contextMenu = false"><div class="w-6"><font-awesome-icon icon="x" class="mt-0.5" /></div>Delete</div>
                    </div>
                </div>
                
                <template v-if="trackStore.track">
                    <TrackDetails :track="trackStore.track" :current-track="currentTrack" :current-track-playback-time="currentTrackPlaybackTime" :current-track-playback-total-time="currentTrackPlaybackTotalTime" @playTrack="track_play(trackStore.track)"></TrackDetails>
                </template>

                <div class="p-4 items-center text-sm h-[44px] dark:h-[45px] bg-gradient-to-b from-gray-100 dark:from-ngreyblackhover border-b dark:border-black flex font-bold">
                    <div>{{ trackStore.num_results }} Related</div>
                </div>
            </template>

            <div class="mb-20">
                <template v-if="searchResultDisplayType === 'grid'">
                    <div class="p-4 pt-1.5 pr-2 h-[44px] dark:h-[45px] text-sm border-b dark:border-black flex font-bold">
                        <div class="mt-1">Items</div>
                        <div @click="searchResultTableRowsConfigModalShow()" @click.stop class="ml-auto text-sm rounded-md px-2 items-center hover:text-npurple cursor-pointer font-medium whitespace-nowrap">
                            <div class="border dark:border-gray-700 hover:border-npurple rounded-md inline-block py-1 px-2 text-gray-800 dark:text-gray-200 hover:text-npurple">
                                <font-awesome-icon icon="table-columns" class="mr-1" />
                                Display
                            </div>
                        </div>
                    </div>
                    <div class="grid lg:grid-cols-4 grid-cols-2 gap-2 p-2">
                        <div 
                            v-for="(track, index) in trackStore.tracks" :key="track.id" 
                            @click="track_play(track)" @click.stop
                            class="group text-white bg-white border dark:border-0 dark:bg-black rounded-md relative cursor-pointer min-w-[150px] flex flex-col justify-between overflow-hidden" 
                            style="height: 227px;"
                        >   
                            <div class="p-2 pb-1 rounded dark:text-white text-black flex text-xs lg:text-sm">
                                <div 
                                    class="mobilehide min-h-[45px] min-w-[45px] h-[45px] w-[45px] mr-3 rounded bg-cover relative cursor-pointer"
                                    :style="`background-image: url(${getTrackImage(track, false)})`"
                                >
                                    <div class="text-center pt-2.5 top-0 left-0 w-full h-full group-hover:bg-[rgba(0,0,0,0.6)] text-white rounded" :class="{'bg-[rgba(0,0,0,0.6)]': track.id === currentTrack.id && currentTrack.isPlaying}">
                                        <template v-if="isPlayableTrack(track)">
                                            <template v-if="track.id === currentTrack.id && currentTrack.isPlaying">
                                                <img
                                                    src="/assets/equaliser-animated-green.gif"
                                                    width="15"
                                                    height="15"
                                                    class="cursor-pointer group-hover:hidden inline-block"
                                                />
                                                <font-awesome-icon
                                                    icon="pause"
                                                    size="lg"
                                                    class="cursor-pointer hidden group-hover:inline-block"
                                                />
                                            </template>
                                            <template v-else>
                                                <font-awesome-icon
                                                    icon="play"
                                                    size="lg"
                                                    class="cursor-pointer hidden group-hover:inline-block ml-1"
                                                />
                                            </template>
                                        </template>
                                    </div>
                                </div>
                                <div>
                                    <div class="font-medium hover:underline inline-block" @click="gotoTrack(track)" @click.stop :class="{'text-ngreenhover': track.id === currentTrack.id}">
                                        {{ showTrackTitleWithFallback(track, index) }}
                                    </div>
                                    <div>
                                        <div v-if="track.meta.artist" class="hover:underline text-xs text-gray-500 dark:text-gray-400 cursor-pointer inline-block" @click="addFilter({ name: 'Artist',key: 'artist', value: track.meta.artist, type: 'string', search: 'metadata' })" @click.stop>
                                            {{ track.meta.artist }}
                                        </div>
                                    </div>
                                </div>
                                <font-awesome-icon icon="magnifying-glass" class="ml-auto cursor-pointer mx-2 mt-0.5 hover:text-ngreenhover" @click="searchSimilarityTrack.value = track" @click.stop />
                            </div>
                            
                            <template v-if="getTrackSpectrogram(track)">
                                <div class="relative mt-auto flex-grow" @click="seekAudio($event, track)" @click.stop>
                                    <div v-if="track.id === currentTrack.id" :style="{ left: progress + '%' }" class="absolute z-10 h-full opacity-70 w-[2px] h-full bg-npurple"></div>
                                    <img :src="getTrackSpectrogram(track)" class="w-full h-full object-cover invert dark:invert-0 cursor-pointer rounded" />
                                </div>
                            </template>
                        </div>
                    </div>
                </template>
                <table class="min-w-full table-auto" v-if="searchResultDisplayType === 'list'">
                    <thead class="text-left text-xs text-gray-600 dark:text-gray-400">
                        <tr class="border-b dark:border-black h-[44px] dark:h-[45px]">
                            <th class="px-2 py-2 dark:pt-2 w-5 pl-5">
                                Title
                            </th>
                            <th class="px-2 py-2 dark:pt-2"></th>
                            <template v-for="(row, rowindex) in searchResultTableRows.optionsSelected" :key="rowindex">
                                <th class="px-2 py-2 dark:pt-2">{{ row.name }}</th>
                            </template>
                            <th class="px-3 pl-1 py-1.5 dark:pt-1 text-right cursor-pointer hover:text-npurple whitespace-nowrap">
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(track, index) in trackStore.tracks" :key="track.id">
                            <tr class="select-none group text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-ngreytransparent draggable" draggable="true" @dragstart="onDragStart($event, track)" :class="{ 'bg-gray-100 dark:bg-ngreytransparent border-t dark:border-black' : track.isOpen, 'bg-blue-100 dark:bg-blue-800' : isTrackSelected(track.id)}" @click="trackDetailsToggle(track, $event)" @mouseenter="contextMenuClose(track)">
                                <td class="w-5 py-2 px-4 text-right min-w-[50px] relative" @click="track_play(track)" @click.stop>
                                    <div
                                        class="h-[40px] w-[40px] rounded bg-cover relative cursor-pointer"
                                        :style="`background-image: url(${getTrackImage(track, false)})`"
                                    >
                                        <div class="text-center pt-[10px] top-0 left-0 w-full h-full group-hover:bg-[rgba(0,0,0,0.6)] text-white rounded" :class="{'bg-[rgba(0,0,0,0.6)]': track.id === currentTrack.id && currentTrack.isPlaying}">
                                            <template v-if="isPlayableTrack(track)">
                                                <template v-if="track.id === currentTrack.id && currentTrack.isPlaying">
                                                    <img src="/assets/equaliser-animated-green.gif" width="15" height="15" class="cursor-pointer group-hover:hidden inline-block" />
                                                    <font-awesome-icon icon="pause" size="lg" class="cursor-pointer hidden group-hover:inline-block" />
                                                </template>
                                                <template v-else>
                                                    <font-awesome-icon icon="play" size="lg" class="cursor-pointer hidden group-hover:inline-block ml-1" />
                                                </template>
                                            </template>
                                        </div>
                                    </div>
                                </td>
                                <td class="pr-2 pl-0">
                                    <div class="font-medium hover:underline inline-block dragclone" @click="gotoTrack(track)" @click.stop :class="{'text-ngreenhover': track.id === currentTrack.id}">
                                        {{ showTrackTitleWithFallback(track, index) }}
                                    </div>
                                    <div>
                                        <div v-if="track.meta.artist" class="hover:underline text-xs text-gray-500 dark:text-gray-400 cursor-pointer inline-block" @click="addFilter({ name: 'Artist',key: 'artist', value: track.meta.artist, type: 'string', search: 'metadata' })" @click.stop>
                                            {{ track.meta.artist }}
                                        </div>
                                    </div>
                                </td>

                                <template v-for="(row, rowindex) in searchResultTableRows.optionsSelected" :key="rowindex">
                                    <td class="px-2 leading-5 text-xs text-gray-600 dark:text-gray-300">
                                        <template v-if="row.name === 'Type'">
                                            <div class="capitalize">{{ track.track_type }}</div>
                                        </template>
                                        <template v-else-if="row.type === 'meta'">
                                            <template v-if="row.name === 'Duration'">
                                                {{ formatDuration(track.meta.duration) }}
                                            </template>
                                            <template v-if="row.name === 'Spectrogram'">
                                                <template v-if="getTrackSpectrogram(track)">
                                                    <div class="relative mr-4" @click="seekAudio($event, track)" @click.stop>
                                                        <div v-if="track.id === currentTrack.id" :style="{ left: progress + '%' }" class="absolute z-10 h-full opacity-70 w-[2px] h-full bg-npurple"></div>
                                                        <img :src="getTrackSpectrogram(track)" class="max-h-[40px] w-full invert dark:invert-0 cursor-pointer rounded" />
                                                    </div>
                                                </template>
                                            </template>
                                            <template v-if="row.name === 'Artist' && track.meta.artist">
                                                <div class="hover:underline" @click="addFilter({ name: 'Artist', key: 'artist', value: track.meta.artist, type: 'string', search: 'metadata' })" @click.stop>
                                                    {{ track.meta.artist }}
                                                </div>
                                            </template>
                                            <template v-if="row.name === 'Album' && track.meta.album">
                                                <div class="hover:underline" @click="addFilter({ name: 'Album', key: 'album', value: track.meta.album, type: 'string', search: 'metadata' })" @click.stop>
                                                    {{ track.meta.album }}
                                                </div>
                                            </template>
                                        </template>
                                        <template v-else-if="row.type === 'plugin'">
                                            <template v-if="row.name === 'Transcription'">
                                                <template v-if="getPluginData(track.plugin_data, row.plugin, row.key)[0]">
                                                    <TrackTranscription :plugindata="getPluginData(track.plugin_data, row.plugin, row.key)[0].value" :playbacktime="currentTrackPlaybackTime" :highlight="track.id === currentTrack.id"></TrackTranscription>
                                                </template>
                                            </template>
                                            <template v-else>
                                                <template v-if="getPluginData(track.plugin_data, row.plugin, row.key)[0]">
                                                    {{  getPluginData(track.plugin_data, row.plugin, row.key)[0].value }}
                                                </template>
                                            </template>
                                        </template>
                                    </td>
                                </template>
                            
                                <td class="pr-3 flex gap-4 relative">
                                    <div class="ml-auto flex items-center mt-3.5">
                                        <div class="flex items-center gap-6 invisible group-hover:visible">
                                            <button @click="track.contextMenu = !track.contextMenu" class="cursor-pointer px-4 text-gray-600 dark:hover:text-gray-100" @click.stop>
                                                <font-awesome-icon icon="ellipsis-vertical" size="xl" />
                                            </button>
                                        </div>
                                    </div>
                                    <div v-show="track.contextMenu" @click="track.contextMenu = false" @click.stop class="invisible group-hover:visible origin-top-right absolute right-4 mt-8 w-56 p-1 rounded-md shadow-lg bg-gray-100 dark:bg-[#282828] ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="collectionTrack.value = track; browserStore.collectionModal = true; track.contextMenu = false" @click.stop><div class="w-6"><font-awesome-icon icon="plus" class="mt-0.5" /></div> Add to collection</div>
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="searchSimilarityTrack.value = track"><div class="w-6"><font-awesome-icon icon="bars" class="mt-0.5" /></div>Find similar</div>
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="gotoTrack(track)"><div class="w-6"><font-awesome-icon icon="eye" class="mt-0.5" /></div>View</div>
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="downloadTrack(track)"><div class="w-6"><font-awesome-icon icon="download" class="mt-0.5" /></div>Download</div>
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="editTrack(track); trackStore.track.contextMenu = false"><div class="w-6"><font-awesome-icon icon="pen" class="mt-0.5" /></div>Edit</div>
                                        <div class="flex p-3 hover:bg-gray-200 dark:hover:bg-[#3e3e3e] rounded" @click="deleteTrack(track); track.contextMenu = false"><div class="w-6"><font-awesome-icon icon="x" class="mt-0.5" /></div> Delete</div>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="track.isOpen" class="text-sm">
                                <td :colspan="searchResultTableRows.optionsSelected.length + 3" class="p-0"> 
                                    <template v-if="track">
                                        <TrackDetails :track="track" :current-track="currentTrack" :current-track-playback-time="currentTrackPlaybackTime" :current-track-playback-total-time="currentTrackPlaybackTotalTime" @playTrack="track_play(track)"></TrackDetails>
                                    </template>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
                
                <div class="p-4 text-center" v-if="trackStore.tracks && trackStore.tracks.length === 0 && !isLoading">
                    No results
                </div>
                <div class="text-center" v-if="isLoading">
                    <img src="/assets/spinner1.gif" width="25" class="mr-2 inline" />
                </div>
            </div>
        </div>
        <div class="fixed bottom-0 z-40" :class="{ 'player_narrow' : browserStore.sidebarActive, 'w-full': !browserStore.sidebarActive}">
            <AudioPlayer
                ref="audioPlayerRef"
                :datasource="currentTrackUrl"
                :track="currentTrack"
                @updateTrackStatus="handleAudioPlayed"
                @updateTrackCurrentTime="handleAudioTime"
            ></AudioPlayer>
        </div>
        <modal
            :open="searchResultTableRowsConfigModal"
            @update:open="searchResultTableRowsConfigModal = $event"
            title="Display"
        >
            <div class="min-w-[300px] mt-4 overflow-auto max-h-[70vh]" @click.stop>
                <div class="mb-4 font-bold border-t dark:border-gray-700 pt-4 text-sm">View as</div>
                <ul>
                    <li class="cursor-pointer hover:bg-ngreytransparent rounded p-2" :class="{'text-ngreenhover bg-ngreytransparent': searchResultDisplayType === 'list'}" @click="searchResultDisplayType = 'list'; searchResultTableRowsConfigModal = false">
                        <font-awesome-icon icon="list" class="mr-2" />
                        List
                    </li>
                    <li class="cursor-pointer hover:bg-ngreytransparent rounded p-2" :class="{'text-ngreenhover bg-ngreytransparent': searchResultDisplayType === 'grid'}" @click="searchResultDisplayType = 'grid'; searchResultTableRowsConfigModal = false">
                        <font-awesome-icon icon="grip" class="mr-2" />
                        Grid
                    </li>
                </ul>
                <template v-if="searchResultDisplayType === 'list'">
                    <div class="border-t dark:border-gray-700 pt-4 mb-4 mt-4 font-bold text-sm">Columns</div>
                    <ul class="max-h-[300px] overflow-scroll bg-ngreytransparent rounded">
                        <li
                            v-for="(filter, index) in searchResultTableRows.options"
                            :key="index"
                            class="flex items-center p-2 border-b text-sm border-ngreytransparent hover:bg-ngreytransparent"
                            :class="{'text-ngreenhover': isFilterSelected(filter)}"
                        >
                            <label class="flex items-center cursor-pointer w-full">
                                <input
                                    type="checkbox"
                                    class="mr-2"
                                    :checked="isFilterSelected(filter)"
                                    @change="searchResultTableRowsConfigModalToggle(index)"
                                />
                                <span>{{ filter.name }}</span>
                            </label>
                        </li>
                    </ul>
                </template>
                <button class="mt-4 px-6 py-2 text-md bg-npurple text-white font-medium rounded-lg focus:outline-none" @click="searchResultTableRowsConfigModal = false">
                    Done
                </button>
            </div>
        </modal>
    </div>
    <modal :open="browserStore.collectionModal" @update:open="collectionModalCloseCall()" title="">   
        <Collection :track="collectionTrack" :selected-track-ids="selectedTracks" :track-type-filter="trackTypeSettings.value" :collection="collectionStore.collection" @modalClosed="collectionModalClose" ref="collectionModalRef"></Collection>
    </modal>
    <Tools :modalopen="browserStore.toolViewActive" @click="browserStore.toolViewActive = !browserStore.toolViewActive" @modalClosed="browserStore.toolViewActive = false"></Tools>
    <TrackCreation :track="trackCreationTrack" :modalopen="trackCreationModal" @click="trackCreationModal = !trackCreationModal" @modalClosed="trackCreationModalClose"></TrackCreation>
    <Exporter :modalopen="exporterShow" @modalClosed="exporterShow = false"></Exporter>
</template>


<style scoped>
.player_narrow{
    width: calc(100% - 250px);
}

table {
    border-collapse: collapse;
    border-spacing: 0;
    table-layout: auto;
    width: 100%;
}
th {
    font-weight: 500;
}
thead:after {
    content: "";
    display: block;
    height: 6px;
}
td {
  text-overflow: ellipsis;
}
</style>
<style>
/* clears the ‘X’ from Internet Explorer */
input[type=search]::-ms-clear { display: none; width : 0; height: 0; }
input[type=search]::-ms-reveal { display: none; width : 0; height: 0; }/* clears the ‘X’ from Chrome */
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration { display: none; }
.draggable {
    cursor: grab;
    touch-action: none; /* This line is important to make it work on touch devices */
}
</style>