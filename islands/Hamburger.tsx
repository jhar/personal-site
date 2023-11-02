import type { Signal } from "@preact/signals";

interface HamburgerProps {
    animated: Signal<boolean>;
    showPanel: Signal<boolean>;
}

export default function Hamburger({ animated, showPanel }: HamburgerProps) {
    const toggle = () => {
        animated.value = true;
        showPanel.value = !showPanel.value;
    }

    return (
        <li
            class="block float-right h-full sm:hidden mt-2 w-6"
            onClick={toggle}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="100%">
                <path d="M 0 7.5 L 0 12.5 L 50 12.5 L 50 7.5 Z M 0 22.5 L 0 27.5 L 50 27.5 L 50 22.5 Z M 0 37.5 L 0 42.5 L 50 42.5 L 50 37.5 Z"/>
            </svg>
        </li>
    )
}