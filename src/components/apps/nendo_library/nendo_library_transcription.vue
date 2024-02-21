<script setup>
import { ref,  onMounted, computed } from 'vue'

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

    entireText.value = entries.value.map(entry => entry.text).join(' ')
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
    if(highlightedIndexes.value.has(index)) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        if (isDarkMode) { 
            return 'highlightdark'
        }
        return 'highlight'
    }
    return ''
}

</script>


<template>
    <div class="break-all">
        <template v-if="props.highlight">
            <span v-for="(entry, index) in entries" :key="index" :class="highlightClass(index)" class="mr-1">
                {{ entry.text }}
            </span>
        </template>
        <template v-else>
            {{ entireText }}
        </template>
    </div>
</template>

<style scoped>
.highlight {
  background-color: rgb(212, 232, 255);
  border-radius: 5px;
}
.highlightdark {
  background-color: rgb(26, 83, 147);
  border-radius: 5px;
}
</style>
