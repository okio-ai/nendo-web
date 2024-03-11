<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBrowserStore } from '@/stores/browser.js'
import { useCollectionStore } from '@/stores/collection'
import { debounce } from 'lodash'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'

const router = useRouter()
const browserStore = useBrowserStore()
const collectionStore = useCollectionStore()

onMounted(() => {
    getCollections()
})

const tools = ref([
    {'name': 'Voice Analysis', 'id': 'voiceanalysis'},
    {'name': 'Voice Generator', 'id': 'voicegen'},
    {'name': 'Music Analysis', 'id': 'musicanalysis'},
    {'name': 'Music Polymath', 'id': 'polymath'},
    {'name': 'Music Mashuper', 'id': 'mashuper'},
    {'name': 'Music Generator', 'id': 'musicgen'},
    {'name': 'MusicGen Trainer', 'id': 'musicgentrain'},
    {'name': 'Web Importer', 'id': 'webimport'},
    // {'name': 'Get Page', 'id': 'getpage'},
])

const searchText = ref('')
const sideBarView = ref('collection')
const showSidebarSearch = ref(false)

async function getCollections() { 
    await collectionStore.fetchCollections()
}

const openTool = (tool) => {
    if (router.currentRoute.value.name === 'library' || router.currentRoute.value.name === 'track' || router.currentRoute.value.name === 'collection') {
        browserStore.toolViewActiveTool = tool.id
        browserStore.toolViewActive = true
    } else {
        router.push({ path: '/library/'})
        setTimeout(function(){
            browserStore.toolViewActiveTool = tool.id
            browserStore.toolViewActive = true  
        },500)
    }
}

const filteredCollections = computed(() => {
    if (!searchText.value) {
        return collectionStore.collections
    }
    return collectionStore.collections.filter((collection) =>
        collection.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
})

const filteredTools = computed(() => {
    if (!searchText.value) {
        return tools.value
    }
    return tools.value.filter((tool) =>
        tool.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
})

const handleSearchInput = debounce((event) => {
    searchText.value = event.target.value
}, 300)

function isCollectionSelected(collection) { 
    if (router.currentRoute.value.name === 'collection' && router.currentRoute.value.params.id === collection.id) {
        return true
    }
    return false
}

function isLibrarySelected() { 
    if (router.currentRoute.value.name === 'library') {
        return true
    }
    return false
}

const gotoCollection = (collection) => {
    router.push({ path: '/collection/' + collection.id })
    searchClose()
    if(browserStore.isMobile) {
        browserStore.sidebarActive = false
    }
}

const searchClose = () => {
    if (searchText.value.length === 0) {
        showSidebarSearch.value = false
        searchText.value = ''
    }
} 

const addCollection = () => {
    if (router.currentRoute.value.name === 'library' || router.currentRoute.value.name === 'track' || router.currentRoute.value.name === 'collection') {
        browserStore.collectionModal = true
        browserStore.collectionModalAdd = true
    } else {
        router.push({ path: '/library/'})
        setTimeout(function(){
            browserStore.collectionModal = true
            browserStore.collectionModalAdd = true
        },500)
    }
} 

// drag n drop 
const dragEnter = (event, collection) => {
    event.target.style.backgroundColor = 'rgba(96,93,255,0.3)'
};

const dragLeave = (event, collection) => {
    event.target.style.backgroundColor = ''
};

const drop = (event, collection) => {
    event.preventDefault();
    event.target.style.backgroundColor = ''
    // const data = event.dataTransfer.getData("text/plain");
    handleDroppedItem(collection);
};

async function handleDroppedItem (collection) {
    await collectionStore.addSelectedTracksToCollection(
        collection.id, browserStore.draggableTracks
    )
    if (browserStore.draggableTracks.length > 0) {
        useToast().success(browserStore.draggableTracks.length + ' tracks added to: ' + collection.name)
    } else {
        useToast().success('Track added to: ' + collection.name)
    }
}


</script>

<template>
    <aside @click="searchClose" class="flex flex-col min-w-[230px] h-full font-medium dark:text-gray-300 border-r border-gray-300 dark:border-black dark:border-r-4 z-40 bg-white dark:bg-ngreyblack text-sm dark:text-ngreyblack">
        <div class="flex text-2xl items-center border-b dark:border-b-4 dark:border-black py-3 items-center min-h-[62px] dark:min-h-[62px]">
            <font-awesome-icon icon="bars" class="mx-[26px] text-gray-500 hover:text-ngreenhover cursor-pointer" @click="browserStore.sidebarActive = !browserStore.sidebarActive" />
            <router-link to="/library">
                <img class="h-[20px] min-w-[135px] mr-6 mt-[-4px]" src="/assets/nendo_logo.png" alt="nendo" />
            </router-link>
        </div>

        <div class="flex text-center font-medium bg-white dark:bg-ngreyblacktransparent text-gray-500 dark:text-gray-400 border-b dark:border-0 dark:border-black min-h-[44px] dark:min-h-[45px]">
            <div class="w-1/2 px-3 pt-[12px] cursor-pointer dark:hover:text-white" :class="{'border-b-2 dark:border-b-0 font-bold border-ngreenhover dark:bg-ngreyblack text-gray-800 dark:text-gray-100': sideBarView === 'collection'}" @click="sideBarView = 'collection'; showSidebarSearch = false">Collections</div>
            <div class="w-1/2 px-3 pt-[12px] cursor-pointer dark:hover:text-white" :class="{'border-b-2 dark:border-b-0 font-bold border-ngreenhover dark:bg-ngreyblack text-gray-800 dark:text-gray-100': sideBarView === 'tools'}" @click="sideBarView = 'tools';  showSidebarSearch = false">Tools</div>
        </div>

        <div v-if="showSidebarSearch" class="mx-4 mt-3 mb-2 rounded-md border dark:border-0 border-gray-300 overflow-hidden bg-white dark:bg-ngreytransparent text-sm">
            <div class="relative">
                <input
                    type="search"
                    v-focus
                    v-model="searchText"
                    class="form-control relative flex-auto min-w-0 max-w-[93%] block w-full px-4 py-[6px] font-normal text-gray-700 dark:text-gray-200 bg-transparent bg-clip-padding border-0 m-0 focus:text-gray-700 focus:outline-none"
                    placeholder="Search"
                    aria-label="Search"
                    aria-describedby="button-addon2"
                    @input="handleSearchInput"
                    @click.stop
                />
                <span class="absolute top-1.5 right-4 pl-4">
                    <font-awesome-icon icon="magnifying-glass" class="cursor-pointer ml-2 text-gray-500" />
                </span>
            </div>
        </div>
        <div v-else class="flex w-full py-2 pb-1">
            <div @click="showSidebarSearch = true" @click.stop class="relative hover:bg-ngreyblacktransparent text-gray-500 hover:text-white rounded-full inline-block mx-4 w-8 h-8 text-center">
                <font-awesome-icon icon="magnifying-glass" class="cursor-pointer p-2 rounded-full" />
            </div>
            <div v-if="sideBarView === 'collection'" @click="addCollection" class="relative text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-xl inline-block mr-4 px-2 h-8 text-center flex cursor-pointer ml-auto">
                <div class="text-xs mt-1.5">Add</div>
                <font-awesome-icon icon="plus" class="mt-2 ml-2" />
            </div>
        </div>

        <ul class="flex-grow overflow-auto mb-4 text-sm">
            <template v-if="sideBarView === 'collection'"> 
                <template v-if="filteredCollections === undefined || filteredCollections.length === 0">
                    <div class="p-2 px-4 text-gray-500">No collections found</div>
                </template>
                <li
                    v-for="(collection) in filteredCollections"
                    :key="collection.id"
                    class="flex items-center px-6 py-3 flex hover:bg-gray-100 dark:hover:bg-ngreytransparent cursor-pointer text-gray-600 dark:text-gray-300"
                    :class="{ 'bg-gray-100 dark:bg-ngreytransparent font-medium text-black dark:text-gray-100' : isCollectionSelected(collection) }"
                    @click="gotoCollection(collection)"
                    @dragover.prevent 
                    @dragenter="dragEnter($event, collection)"
                    @dragleave="dragLeave($event, collection)"
                    @drop="drop($event, collection)"
                >
                    <div class="mr-1">
                        <font-awesome-icon icon="list" class="mr-3 mt-0.5" />
                    </div>
                    <div>
                        {{ collection.name }}
                    </div>
                </li>
            </template>
            <template v-if="sideBarView === 'tools'"> 
                <template v-if="filteredTools === undefined || filteredTools.length === 0">
                    <div class="p-2 px-4 text-gray-500">No tools found</div>
                </template>
                <li
                    v-for="(tool) in filteredTools"
                    :key="tool.id"
                    class="flex items-center px-6 py-3 flex hover:bg-gray-100 dark:hover:bg-ngreytransparent cursor-pointer text-gray-600 dark:text-gray-300"
                    @click="openTool(tool)"
                    @click.stop
                >
                    <div class="w-8">
                        <font-awesome-icon icon="wand-magic-sparkles" class="mr-3 mt-0.5" />
                    </div>
                    <div>
                        {{ tool.name }}
                    </div>
                </li>
            </template>
        </ul>

        <div class="w-full border-t dark:border-t-4 dark:border-black text-gray-800 dark:text-gray-200 flex pb-[12px] pt-[11px]">
            <router-link to="/user" class="flex-1 flex items-center justify-center border-r border-gray-200 dark:border-black">
                <div class="px-4 py-3 flex hover:text-ngreenhover cursor-pointer rounded-md">
                    <div class="w-6">
                        <font-awesome-icon icon="person" />
                    </div>
                    <div>Account</div>
                </div>
            </router-link>
            <router-link to="/action" class="flex-1 flex items-center justify-center">
                <div class="px-4 py-3 flex hover:text-ngreenhover cursor-pointer rounded-md">
                    <div class="w-7">
                        <font-awesome-icon icon="clock" />
                    </div>
                    <div>Actions</div>
                </div>
            </router-link>
        </div>
    </aside>
</template>

<style scoped></style>
