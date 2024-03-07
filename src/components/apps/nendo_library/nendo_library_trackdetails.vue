<template>
<div class="bg-gray-100 dark:bg-ngreyblack">
    <div class="flex max-w-screen overflow-x-auto border-b border-t dark:border-black">
        <div v-for="(info, infoindex) in track_data" :key="infoindex" class="text-sm font-medium cursor-pointer hover:text-gray-500 hover:border-b-2 py-3 px-4 border-black dark:border-white whitespace-nowrap text-gray-500" :class="{'border-b-2 text-gray-800 dark:text-white': trackActiveTab === infoindex}" @click="trackActiveTab = infoindex">
            {{ capitalizeWords(info.key) }}
        </div>
    </div>
    <div v-for="(info, infoindex) in track_data" :key="infoindex">
        <div v-if="trackActiveTab === infoindex" class="text-sm leading-6 border-b dark:border-black">
            <template v-if="info.id === 'meta'">
                <div class="p-4 pb-3">
                    <template v-for="(value, key, index) in track.meta" :key="index" >
                        <div class="border dark:border-gray-800 p-2 inline-block mb-2 mr-2 rounded-md capitalize text-xs hover:bg-ngreytransparent" v-if="value">
                            <b>{{ key }}:</b> {{ roundFloat(value) }}
                        </div>
                    </template>
                </div>
            </template>
            <template v-else-if="info.id === 'classify'">
                <div class="p-4 pb-3">
                    <template v-for="(value, key, index) in classify_data" :key="index" >
                        <div class="border dark:border-gray-800 p-2 inline-block mb-2 mr-2 rounded-md capitalize text-xs hover:bg-ngreytransparent" v-if="value">
                            <b>{{ value.key }}:</b> {{ roundFloat(value.value) }}
                        </div>
                    </template>
                </div>
            </template>
            <template v-else-if="info.id === 'spectrogram'">
                <div class="relative" @click="seekAudio($event)">
                    <div v-if="track.id === currentTrack.id" :style="{ left: progress + '%' }" class="absolute z-10 h-full opacity-70 w-[2px] h-full bg-npurple"></div>
                    <img :src="getTrackSpectrogram(track)" class="max-h-[300px] w-full invert dark:invert-0 cursor-pointer" />
                </div>
            </template>
            <template v-else>
                <div class="pl-4 pt-3 pb-5 px-4 overflow-y-scroll ">
                    <template v-if="info.key === 'transcription'">
                        <TrackTranscription :plugindata="getPluginData(track.plugin_data)[0].value" :playbacktime="currentTrackPlaybackTime" :highlight="track.id === currentTrack.id"></TrackTranscription>
                    </template>
                    <template v-else-if="info.key === 'caption'">
                        <TrackTranscription :plugindata="deconstructCaption(getPluginData(track.plugin_data, 'nendo_plugin_caption_lpmusiccaps', 'caption'))" :playbacktime="currentTrackPlaybackTime" :highlight="track.id === currentTrack.id"></TrackTranscription>
                    </template>

                    <template v-else-if="info.key === 'topic_detection'">
                        <template v-for="([key, value], index) in Object.entries(deconstructTopics(info.value))" :key="index" >
                            <template v-for="(item, indexValue) in value" :key="indexValue">
                                <div class="border dark:border-gray-800 p-2 inline-block mb-2 mr-2 rounded-md capitalize text-xs hover:bg-ngreytransparent" v-if="value">
                                    <b>{{ key }}:</b> {{ item }}
                                </div>
                            </template>
                        </template>
                    </template>

                    <template v-else-if="info.key === 'sentiment_analysis'">
                        <template v-for="([key, value], index) in Object.entries(deconstructSentiments(info.value))" :key="index" >
                            <template v-for="(item, indexValue) in value" :key="indexValue">
                                <div class="border dark:border-gray-800 p-2 inline-block mb-2 mr-2 rounded-md capitalize text-xs hover:bg-ngreytransparent" v-if="value">
                                    <b>{{ key }}:</b> {{ item }}
                                </div>
                            </template>
                        </template>

                    </template>
                    <template v-else-if="info.key === 'summary'">
<!--                        strip leading summary: which sometimes gets added by the LLM-->
                        <div v-html="info.value.replace('Summary:', '')"></div>
                    </template>
                    <template v-else>
                        <div v-html="info.value"></div>
                    </template>
                </div>
            </template>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useBrowserStore } from '@/stores/browser.js'
import TrackTranscription from '@/components/apps/nendo_library/nendo_library_transcription.vue'

const browserStore = useBrowserStore()

const props = defineProps({
    track: {
        type: Object,
        required: true
    },
    currentTrack: {
        type: Object,
        required: true
    },
    currentTrackPlaybackTime: {
        type: Number,
        required: true
    },
    currentTrackPlaybackTotalTime: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['playTrack'])

const trackActiveTab = ref(0)
const track_data = ref([])
const classify_data = ref([])

onMounted(async () => {
    track_data.value = getData(props.track)
})


watch(
  () => props.track.plugin_data,
  () => {
    track_data.value = getData(props.track)
  }
)

const progress = computed(() => {
    return (props.currentTrackPlaybackTime / props.currentTrackPlaybackTotalTime) * 100;
})

const getData = (track) => {
    const data_final = []
    classify_data.value = []
    let data_classify = false

    if (track.plugin_data) {
        const data = getPluginData(track.plugin_data)
        for(let i = 0; i < data.length; i++) {
            if (data[i].plugin_name === 'nendo_plugin_classify_core') {
                classify_data.value.push(data[i])
                data_classify = true
            } else {
                data_final.push(data[i])
            }
        }
    }

    data_final.unshift({id:'meta', key: 'Metadata'})

    if (data_classify){
        data_final.unshift({id:'classify', key: 'Analysis'})
    }
    
    if(getTrackSpectrogram(props.track)) {
        data_final.unshift({id:'spectrogram', key: 'Spectrogram'})
    }

    return data_final
}

const getPluginData = (plugin_data, fieldName = null, keyValue = null) => {
    return plugin_data.filter(data => {
        const nameMatch = fieldName ? data.plugin_name === fieldName : true
        const keyMatch = keyValue ? data.key === keyValue : true
        return nameMatch && keyMatch
    })
}

const deconstructSentiments = (sentiments) => {
    const result = {
        primary: [],
        secondary: [],
        intensity: []
    }

    const regex = {
        primary: /Primary Sentiment: (\w+)/,
        secondary: /Secondary Sentiments: ((?:\w+(?:, )?)+)/,
        intensity: /Intensity: (\d+)/
    }

    Object.entries(regex).forEach(([category, r]) => {
        const match = r.exec(sentiments)
        if (match && match[1]) {
            if (category === 'primary' || category === 'intensity') {
                result[category].push(match[1])
            } else {
                const items = match[1].split(',').map(item => item.trim())
                result[category] = result[category].concat(items)
            }
        }
    })
    return result
}

const deconstructCaption = (caption) => {
    const str = caption[0].value

    // remove trailing \n
    return str.substring(0, str.length - 2)
}

const deconstructTopics = (topics) => {
    const result = {
        concept: [],
        event: [],
        person: [],
        organisation: [],
        place: [],
        date: []
    };

    // Regular expression to match category names and capture everything until the next category
    const regex = /Concepts:([^:]*)|Events:([^:]*)|People:([^:]*)|Organisations:([^:]*)|Places:([^:]*)|Dates:([^:]*)/g;
    let match;

    while ((match = regex.exec(topics))) {
        for (let i = 1; i < match.length; i++) {
            if (match[i] !== undefined) {
                const category = Object.keys(result)[(i - 1)];
                const items = match[i].split(',').map(item => item.trim()).filter(item => item);
                result[category] = result[category].concat(items);
            }
        }
    }

    return result;
}

const capitalizeWords = (str) => {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const roundFloat = (value) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num.toString() === value.toString()) {
        return parseFloat(num.toFixed(3));
    } else {
        return value
    }
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

const seekAudio = (event) => {
    if (props.track.id === props.currentTrack.id) {
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const width = rect.width
        const clickPositionRatio = clickX / width
        const seekTime = props.currentTrackPlaybackTotalTime * clickPositionRatio
        browserStore.audioPlayerSeek = seekTime
    } else {
        emit('playTrack', 'play')
    }
}

</script>