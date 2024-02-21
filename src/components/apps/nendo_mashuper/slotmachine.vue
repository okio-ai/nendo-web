<template>
    <div class="slot-machine">
        <div class="slot" v-for="(slot, index) in slots" :key="slot.title">
            <div class="slot__window">
                <div class="slot__wrap" :ref="(el) => (slotRefs[index] = el)">
                    <div
                        class="slot__item"
                        v-for="opt in slot.items"
                        :key="opt"
                    >
                        <img :src="opt" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, reactive } from 'vue'

const next =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function (cb) {
        window.setTimeout(cb, 1000 / 60)
    }

export default {
    name: 'SlotMachine',
    props: {
        channelimages: {
            type: Array,
            default: () => []
        },
        channelimage: {
            type: String
        }
    },
    setup(props) {
        let images = ref([])
        images.value.push(props.channelimage)
        images.value.push(...props.channelimages)

        const slots = reactive([
            {
                title: 'SlotMachine',
                items: images
            }
        ])

        const slotRefs = slots.map(() => ref(null))

        let opts = null
        let isSpinning = ref(false)
        let stopping = ref(false)

        const animate = () => {
            opts.forEach((opt) => {
                if (!isSpinning.value) {
                    return
                }

                if (!stopping.value && opt.spinSpeed < opt.maxSpinSpeed) {
                    opt.spinSpeed += opt.spinAcceleration
                } else if (stopping.value) {
                    if (opt.spinSpeed > 0) {
                        opt.spinSpeed -= opt.spinDeceleration
                    }

                    // When spinSpeed is close to zero and we're on a boundary, stop
                    if (opt.spinSpeed < opt.spinDeceleration) {
                        const overshoot = (opt.spinProgress * 85) % 85

                        if (overshoot < opt.spinDeceleration * 85) {
                            opt.spinSpeed = 0
                            opt.spinProgress -= overshoot / 85 // Make sure we stop at an exact item boundary
                        }
                    }
                }

                if (opt.spinSpeed < 0) {
                    opt.spinSpeed = 0
                }

                opt.spinProgress += opt.spinSpeed

                const pos =
                    -1 * Math.floor((opt.spinProgress * 85) % opt.height)

                opt.el.style.transform = `translateY(${pos}px)`
            })

            if (opts.some((o) => o.spinSpeed > 0)) {
                next(animate)
            } else {
                isSpinning.value = false
                stopping.value = false
                opts = null
            }
        }

        function getRandomFloat(min, max) {
            return Math.random() * (max - min) + min
        }

        const start = () => {
            if (isSpinning.value) {
                return
            }

            isSpinning.value = true

            opts = slots.map((data, i) => {
                const slot = slotRefs[i]

                const opts = {
                    el: slot,
                    height: data.items.length * 85,
                    spinSpeed: 0, // starts at 0
                    maxSpinSpeed: 0.3, // maximum speed
                    spinAcceleration: getRandomFloat(0.006, 0.002), // gradually speed up
                    spinDeceleration: 1, // gradually slow down 0.005
                    spinProgress: 0
                }

                return opts
            })

            next(animate)
        }

        const stop = () => {
            if (!isSpinning.value) {
                return
            }

            stopping.value = true
        }

        return {
            slots,
            start,
            stop,
            isSpinning,
            slotRefs
        }
    }
}
</script>

<style scoped>
.slot__window {
    width: 85px;
    height: 85px;
    overflow: hidden;
}

.slot__item {
    height: 85px;
    width: 85px;
    padding: 10px;
    text-align: center;
}
</style>
