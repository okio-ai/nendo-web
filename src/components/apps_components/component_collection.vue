<script setup>
import { ref,    onMounted, computed } from 'vue'
import { useCollectionStore } from '@/stores/collection'
import { debounce } from 'lodash'
import { useBrowserStore } from '../../stores/browser'
import { useRouter, useRoute } from 'vue-router'

const collectionStore = useCollectionStore()
const browserStore = useBrowserStore()

// router
const router = useRouter()
const route = useRoute()

const props = defineProps({
    track: {
        type: Object,
        required: true
    },
    trackTypeFilter: {
        type: String,
        required: true
    },
    collection: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['modalClosed'])

const newCollectionName = ref('')
const newCollectionUI = ref(false)
const editCollectionObject = ref()
const collectionUITitle = ref('Collections')
const collectionAddTrack = ref(false)
const collectionSelector = ref({ options: [], collectionSelected: [] })
const collectionAddSelector = ref([])
const searchText = ref('');

onMounted(() => {
    collectionSelector.value.collectionSelected = [props.collection]
    setTitle()
    getCollections()

    if(browserStore.collectionModalAdd){
        createCollection()
    }

    if(browserStore.collectionModalEdit){
        editCollection(browserStore.collectionModalEdit)
    }
})

function setTitle() {
    searchText.value = ''
    if(props.track.value === null || props.track.value === undefined) {
        collectionUITitle.value = 'Collections'
        collectionAddTrack.value = false
        newCollectionUI.value = false
    } else {
        collectionUITitle.value = 'Add to collection'
        collectionAddTrack.value = true

        collectionAddSelector.value = []
        if (props.track.value !== 'bulk') {
            for (let i=0; i < props.track.value.related_collections.length; i++) {
                collectionAddSelector.value.push(props.track.value.related_collections[i].target.id)
            }
        } else {
            if (router.currentRoute.value.name === 'collection') {
                collectionAddSelector.value.push(route.params.id)
            }
        }
    }
}

async function getCollections() { 
    await collectionStore.fetchCollections()
}

function createCollection() {
    collectionUITitle.value = 'New Collection'
    newCollectionUI.value = true
    editCollectionObject.value = null
    newCollectionName.value = ''
}

function createCollectionCancel(){
    setTitle()
    newCollectionUI.value = false

    if(browserStore.collectionModalAdd || browserStore.collectionModalEdit){
        closeModal()
    }
}

function deleteCollection(collection) {
    var answer = window.confirm("Delete Collection?");
    if (answer) {
        collectionStore.deleteCollection(collection.id); 
    }
    createCollectionCancel()
}

async function saveCollection() {
    if (newCollectionName.value === '') {
        return
    }
    if (!editCollectionObject.value) {
        collectionStore.collectionTemp = {name: newCollectionName, collection_type: 'collection', description:''}
        const newcollection = await collectionStore.saveCollection(true)
        collectionSelector.value.collectionSelected[0].id = newcollection.data.id

        newCollectionUI.value = false
    } else {
        collectionStore.collectionTemp = {id: editCollectionObject.value.id, name: newCollectionName, collection_type: 'collection', description:''}
        await collectionStore.saveCollection(false)
        newCollectionUI.value = false
    }
    collectionSelector.value.collectionSelected[0].name = newCollectionName.value
    newCollectionName.value = ''
    setTitle()

    if(browserStore.collectionModalAdd || browserStore.collectionModalEdit){
        closeModal()
    }
}

async function editCollection(collection) {
    newCollectionUI.value = true
    collectionUITitle.value = 'Edit Collection'
    newCollectionName.value = collection.name
    editCollectionObject.value = collection
}
  
function isCollectionSelected(collection) { 
    if (collectionAddTrack.value) {
        const current_selection = collectionAddSelector.value.some(selected => selected === collection.id)
        return current_selection
    }
    return collectionSelector.value.collectionSelected.some(selected => selected.id === collection.id);
}

async function collectionSelected(collection) {
    // go to collection
    if (!collectionAddTrack.value) {
        let selectedIndex = collectionSelector.value.collectionSelected.findIndex(
            (option) => option.id === collection.id
        )
        if (selectedIndex === -1) {
            collectionSelector.value.collectionSelected = [collection]
            emit('modalClosed', {collection: collectionSelector, addTrack: collectionAddTrack})
        } else {
            collectionSelector.value.collectionSelected = []
            emit('modalClosed', {collection: collectionSelector, addTrack: collectionAddTrack})
        }
    }    
    // add/remove track(s) to collection
    if (collectionAddTrack.value) {
        let selectedIndex = collectionAddSelector.value.findIndex(
            (option) => option === collection.id
        )
        if (selectedIndex === -1) {
            collectionAddSelector.value.push(collection.id)
            if (props.track.value === 'bulk'){
                await addTracksToCollection(
                    collection,
                    router.currentRoute.value.name === 'collection' ? route.params.id : '',
                    props.trackTypeFilter
                )
            } else {
                await addTrackToCollection(collection, props.track.value)
            }
        } else {
            collectionAddSelector.value.splice(selectedIndex, 1)
            if (props.track.value === 'bulk'){
                await removeTracksFromCollection(collection, props.trackTypeFilter)
            } else {
                await removeTrackFromCollection(collection, props.track.value)
            }
        }
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

const addTrackToCollection = async (collection, track) => {
    await collectionStore.addTrackToCollection(
        collection.id, track.id
    )
    getCollections()
}

const addTracksToCollection = async (collection, relatedCollectionId, trackTypeFilter) => {
    await collectionStore.addTracksToCollection(
        collection.id,
        {
            relatedCollectionId: relatedCollectionId,
            trackType: trackTypeFilter
        }
    )
}

const removeTracksFromCollection = async (collection, trackTypeFilter) => {
    await collectionStore.removeTracksFromCollection(
        collection.id, trackTypeFilter
    )
}

const removeTrackFromCollection = async (collection, track) => {
    await collectionStore.removeTrackFromCollection(
        collection.id, track.id
    )
    getCollections()
}

const handleSearchInput = debounce((event) => {
    searchText.value = event.target.value
}, 300)

const closeModal = async (collection, track) => {
    browserStore.collectionModalAdd = false
    browserStore.collectionModalEdit = false
    // collectionSelector.value.collectionSelected = [props.collection]
    emit('modalClosed', {collection: collectionSelector, addTrack: collectionAddTrack, track: props.track})
}

const closeModalParent = async (collection, track) => {
    browserStore.collectionModalAdd = false
    browserStore.collectionModalEdit = false
    collectionSelector.value.collectionSelected = [props.collection]
    emit('modalClosed', {collection: collectionSelector, addTrack: collectionAddTrack, track: props.track})
}
defineExpose({ closeModalParent })

</script>

<template>
    <div>
        <div class="flex gap-4 items-center mb-2">
            <div class="font-bold text-xl">
                {{ collectionUITitle }}
            </div>
            <button
                class="top-2 ml-auto text-gray-400 cursor-pointer hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-400"
                @click="closeModal()"
            >
                <font-awesome-icon icon="x" />
            </button>
        </div>
        
        <template v-if="!newCollectionUI">
            <div class="mx-auto rounded-md border dark:border-0 border-gray-300 overflow-hidden bg-white dark:bg-ngreytransparent text-sm mt-3">
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
                    />
                    <span class="absolute top-1.5 right-4 pl-4">
                        <font-awesome-icon icon="magnifying-glass" class="cursor-pointer ml-2 text-gray-500" />
                    </span>
                </div>
            </div>
        </template>
        <div class="min-w-[300px] mt-2 pt-2" @click.stop>
            <template v-if="!newCollectionUI">
                <ul class="max-h-[400px] overflow-scroll mb-4 border dark:border-gray-800 rounded-md text-sm">
                    <template v-if="filteredCollections === undefined || filteredCollections.length === 0">
                        <div class="p-2">No collections found</div>
                    </template>
                    <li
                        v-for="(collectionli) in filteredCollections"
                        :key="collectionli.id"
                        class="flex group items-center py-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        :class="{ 'bg-gray-200 dark:bg-gray-800 font-bold text-white' : isCollectionSelected(collectionli) }"
                        @click="collectionSelected(collectionli)"
                        @click.stop
                    >
                        <label class="flex items-center cursor-pointer">
                            <!-- <template v-if="collectionAddTrack">
                                <input
                                    type="checkbox"
                                    class="mr-2"
                                    :checked="isCollectionSelected(collectionli)"
                                />
                            </template> -->
                            <span>
                                <font-awesome-icon icon="list" class="mr-1 mt-0.5" v-if="!isCollectionSelected(collectionli)" /> 
                                <font-awesome-icon icon="check" class="mr-1 mt-0.5" v-else /> 

                                {{ collectionli.name }}
                            </span>
                        </label>
                        <div class="ml-auto flex gap-2 hidden group-hover:inline-block">
                            <div @click="editCollection(collectionli)" @click.stop><font-awesome-icon icon="gear" class="mr-2 text-gray-400 hover:text-gray-700 cursor-pointer" /></div>
                        </div>
                    </li>
                </ul>
                <button 
                    class="px-6 py-2 text-md bg-npurple text-white font-medium rounded-lg focus:outline-none"
                    @click="closeModal"
                >
                    Done
                </button>
                <button 
                    class="float-right px-4 py-2 text-md bg-gray-300 dark:bg-gray-800 hover:bg-npurple text-white font-medium rounded-lg focus:outline-none"
                    @click="createCollection"
                >
                    + New Collection
                </button>
            </template>
            <template v-if="newCollectionUI">
                <input
                    type="search"
                    v-model="newCollectionName"
                    class="form-control bg-transparent dark:border-gray-700 relative flex-auto min-w-0 block w-full px-4 py-2 text-base font-normal bg-clip-padding border border-solid rounded-md m-0 focus:border-blue-600 focus:outline-none text-gray-700 dark:text-gray-300"
                    placeholder="Collection Name"
                    aria-label="Collection Name"
                    v-focus
                />
                <div class="flex mt-4">
                    <button 
                        class="px-4 py-2 text-md bg-npurple text-white font-medium rounded-lg focus:outline-none transition-colors duration-200 min-w-[110px]"
                        @click="saveCollection()"
                    >
                        Save
                    </button>
                    <button 
                        class="px-4 py-2 text-md bg-gray-300 hover:bg-npurple dark:bg-gray-800 text-white ml-2 font-medium rounded-lg focus:outline-none transition-colors duration-200 min-w-[110px]"
                        @click="createCollectionCancel()"
                    >
                        Cancel
                    </button>
                    <button 
                        class="ml-auto px-4 py-1 text-md bg-gray-300 hover:bg-red-500 dark:bg-gray-800 text-white ml-2 font-medium rounded-lg focus:outline-none transition-colors duration-200 min-w-[110px]"
                        @click="deleteCollection(editCollectionObject)"
                        v-if="editCollectionObject"
                    >
                    <font-awesome-icon icon="x" class="mr-2 text-gray-400 cursor-pointer" /> Delete
                    </button>
                </div>
            </template>

        </div>
    </div>
</template>
<style scoped></style>