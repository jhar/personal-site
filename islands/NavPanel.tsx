import type { Signal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface NavPanelProps {
    animated: Signal<boolean>;
    showPanel: Signal<boolean>;
}

export default function NavPanel({ animated, showPanel }: NavPanelProps) {
    const toggle = () => {
        animated.value = true;
        showPanel.value = !showPanel.value;
    }

    const link = !animated.value ? 'hidden' : showPanel.value ? 'animate-slideUp' : 'animate-slideDown';
    const panel = !animated.value ? 'hidden' : showPanel.value ? 'animate-fadeIn' : 'animate-fadeOut';

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 640) {
                showPanel.value = false;
            }
        }

        addEventListener('resize', handleResize);
        return () => removeEventListener('resize', handleResize);
    }, [showPanel]);

    return (
        <div class={`bg-white ${panel} absolute left-0 top-28 right-0 bottom-11 text-3xl z-10`}>
            <ul class="mt-[7%] px-[7%]">
                <li class={`${link} h-12`}>
                    <a
                        class="text-offblack"
                        href="/greet/about"
                        onClick={toggle}>
                        About
                    </a>
                </li>
                <li class={`${link} h-12`}>
                    <a
                        class="text-offblack"
                        href="/greet/resume"
                        onClick={toggle}>
                        Resume
                    </a>
                </li>
            </ul>
        </div>
    )
}