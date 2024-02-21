<script setup>
import {   computed, getCurrentInstance, ref, reactive, onMounted } from 'vue'
import { useCollectionStore } from '@/stores/collection'
import { useRouter, useRoute } from 'vue-router'

const collectionStore = useCollectionStore()

const BASE_API_URL = import.meta.env.VITE_API_URL

const emit = defineEmits(['collection-select'])

const router = useRouter()
const route = useRoute()

const props = defineProps({
    populateId: {
        type: String,
        required: false
    },
})

const state = reactive({
    collectionId: '',
    collectionSearch: '',
    showCollectionDropdown: false,
})

onMounted(() => {
    getCollections()
    state.collectionId = props.populateId || ''
    if (router.currentRoute.value.name === 'collection'){
        state.collectionId = route.params.id
    }
    if (state.collectionId){
        state.collectionSearch = collectionStore.collections.find((collection) =>
            collection.id === state.collectionId
        ).name
        emit('collection-select', state.collectionId, state.collectionSearch)
    }
})

async function getCollections() { 
    await collectionStore.fetchCollections()
}

const selectCollection = (collection) => {
    state.collectionId = collection.id
    state.collectionSearch = collection.name
    state.showCollectionDropdown = false
    emit('collection-select', collection.id, collection.name)
}

const clearSelection = () => {
    state.collectionId = ''
    state.collectionSearch = ''
    emit('collection-select', '', '')
}    

const filteredCollections = computed(() => {
    if (!state.collectionSearch) {
        return collectionStore.collections
    }
    return collectionStore.collections.filter((collection) =>
        collection.name.toLowerCase().includes(state.collectionSearch.toLowerCase())
    )
})
</script>

<template>
    <div class="dropdown-container text-sm">
        <div class="input-container border border-gray-500 dark:border-gray-700 rounded-md cursor-pointer">
            <input
                class="rounded-md pl-2 pt-2 pb-2 dark:text-white bg-transparent"
                type="text"
                v-model="state.collectionSearch"
                @input="state.showCollectionDropdown = true"
                @focus="state.showCollectionDropdown = true"
                placeholder="Select collection"
            />
            <span v-if="state.collectionId" class="clear-btn text-xl dark:text-white" @click="clearSelection">&times;</span>
        </div>
        <ul v-if="state.showCollectionDropdown" class="dropdown-menu bg-white text-sm border dark:border-gray-700">
            <li
                class="dark:border-gray-700 border-b dark:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                v-for="collection in filteredCollections"
                :key="collection.id"
                @click="selectCollection(collection)"
            >
                {{ collection.name }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.input-container {
  color: #000;
  position: relative;
  display: flex;
  align-items: center;
}

.input-container input {
  width: 100%;
  padding-right: 30px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  cursor: pointer;
}

.dropdown-menu {
  color: #000;
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-menu li {
  padding: 10px;
  cursor: pointer;
}
</style>
