<template>
    <button
        class="p-2 rounded-md px-4 hover:text-red-600"
        :class="{ 'bg-red-500': isRecording, 'bg-[#B8C0C2]': !isRecording }"
        @click="toggleRecord"
    >
        <font-awesome-icon v-if="!isRecording" icon="microphone" size="xl" />
        <font-awesome-icon v-else icon="stop" class="recording-animation" />
    </button>
</template>

<script>
// does not work yet
// https://github.com/higuma/web-audio-recorder-js
// https://github.com/mattdiamond/Recorderjs
// https://github.com/addpipe/simple-recorderjs-demo
// https://addpipe.com/simple-web-audio-recorder-demo/
// https://github.com/grishkovelli/vue-audio-recorder

import { ref, onUnmounted } from 'vue'

export default {
    name: 'AudioRecorder',
    emits: ['recording-complete'],
    setup(props, { emit }) {
        const isRecording = ref(false)
        const mediaRecorder = ref(null)
        const chunks = ref([])
        const recording_length_max = 10 // define length in seconds
        let recordTimeout = null

        const handleDataAvailable = (e) => {
            if (e.data.size > 0) {
                chunks.value.push(e.data)
            }
        }

        const handleStop = () => {
            const blob = new Blob(chunks.value, { type: 'audio/ogg' }) // use the actual MIME type
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'recording1.ogx' // use the actual file extension
            link.click()
            mediaRecorder.value.removeEventListener(
                'dataavailable',
                handleDataAvailable
            )
            mediaRecorder.value.removeEventListener('stop', handleStop)
            mediaRecorder.value.stream
                .getTracks()
                .forEach((track) => track.stop())
            mediaRecorder.value = null
            chunks.value = [] // clear chunks here after stopping recording

            // Emit the event with the url as a parameter
            emit('recording-complete', { url, blob })
        }

        const startNewRecording = () => {
            if (isRecording.value) {
                mediaRecorder.value.start()
                recordTimeout = setTimeout(() => {
                    if (isRecording.value) {
                        mediaRecorder.value.stop()
                    }
                }, recording_length_max * 1000)
            }
        }

        const toggleRecord = async () => {
            if (!isRecording.value) {
                isRecording.value = true
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                })
                mediaRecorder.value = new MediaRecorder(stream)
                mediaRecorder.value.addEventListener(
                    'dataavailable',
                    handleDataAvailable
                )
                mediaRecorder.value.addEventListener('stop', handleStop)
                startNewRecording()
            } else {
                isRecording.value = false
                clearTimeout(recordTimeout)
                mediaRecorder.value.stop()
            }
        }

        onUnmounted(() => {
            if (mediaRecorder.value) {
                mediaRecorder.value.removeEventListener(
                    'dataavailable',
                    handleDataAvailable
                )
                mediaRecorder.value.removeEventListener('stop', handleStop)
                mediaRecorder.value.stream
                    .getTracks()
                    .forEach((track) => track.stop())
            }
        })

        return {
            isRecording,
            toggleRecord
        }
    }
}
</script>
<style scoped>
@keyframes recording-animation {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

.recording-animation {
    animation: recording-animation 1s infinite;
}
</style>
