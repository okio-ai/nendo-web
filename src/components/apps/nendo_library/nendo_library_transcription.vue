<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
    plugindata: {
        type: String,
        required: true
    },
    playbacktime: {
        type: Number,
        required: true
    },
    highlight: {
        type: Boolean,
        required: true
    },
    paragraphAfter: {
        type: Number,
        required: false,
        default: 3
    }
})

const entries = ref([])
const entireText = ref('')

onMounted(() => {
    entries.value = props.plugindata.split('\n').map(entry => {
        let [time, text] = entry.split(']:')
        text = text.replace(/^\s+/gm, '')
        const [startTime, endTime] = time.replace('[', '').split('-')
        if (startTime && endTime) {
            return {
                startTime: convertToSeconds(startTime),
                endTime: convertToSeconds(endTime),
                text: text !== undefined ? text.trim() : ''
            }
        } else {
            return {
                text: props.plugindata
            }
        }
    })

    // join up 5 entries into one
    entireText.value = entries.value.map(entry => entry.text).reduce(
            (acc, text, index) => {
                if (index % props.paragraphAfter === 0) {
                    acc.push('')
                }
                acc[acc.length - 1] += text + ' '
                return acc
            },
            []
        )
    })

const convertToSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number)
    return minutes * 60 + seconds
}

const highlightedIndexes = computed(() => {
    const indexes = new Set()
    entries.value.forEach((entry, index) => {
        if (props.playbacktime >= entry.startTime && props.playbacktime < entry.endTime) {
            indexes.add(index)
        }
    })
    return indexes
})


const highlightClass = (index) => {
    if (highlightedIndexes.value.has(index)) {
        const isDarkMode = document.documentElement.classList.contains('dark')
        if (isDarkMode) {
            return 'highlightdark text-opacity-100'
        }
        return 'highlight text-opacity-100'
    }
    return 'text-opacity-50'
}

</script>


<template>
    <div class="break-word w-[80%] h-96 text-m">
        <template v-if="props.highlight">
            <span v-for="(entry, index) in entries" :key="index" :class="highlightClass(index)" class="text-white">
                {{ entry.text }}
<!--                <template v-if="(index !== 0) && (index % props.paragraphAfter === 0)">-->
<!--                    <p class="mb-5"></p>-->
<!--                </template>-->
            </span>
        </template>
        <template v-else>
            <p class="mb-5" v-for="(entry, index) in entireText" :key="index">
                {{ entry }}
            </p>
        </template>
    </div>
</template>

<style scoped>
.highlight {
    background-color: rgb(212, 232, 255);
    border-radius: 5px;
    font-weight: bold;
}

.highlightdark {
    background-color: rgb(26, 83, 147);
    border-radius: 5px;
    font-weight: bold;
    padding: 1px;
}
</style>
