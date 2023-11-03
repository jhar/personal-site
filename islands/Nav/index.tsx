import { useEffect } from "preact/hooks";
import { useSignal } from '@preact/signals';
import Hamburger from './Hamburger.tsx';
import Mobile from './Mobile.tsx';

/** TODO
    active link color change to black (black?)
**/

export default function Nav() {
    const animated = useSignal(false);
    const showPanel = useSignal(false);

    const toggle = () => {
        animated.value = true;
        showPanel.value = !showPanel.value;
    };

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
        <div class="box-border font-mono mx-0 my-9">
            <div class="h-12 m-auto max-w-5xl min-w-[230px] w-[86%]">
                <span class="float-left py-1 text-2xl sm:text-3xl">JUSTIN HARRISON</span>
                <Hamburger
                    animated={animated}
                    showPanel={showPanel}
                    toggle={toggle}
                />
                <nav class="flex-row float-right h-full hidden items-center sm:flex">
                    <a
                        class="hover:animate-pulse hover:text-blue pl-4 text-lg text-lightgrey"
                        href="/">
                        home
                    </a>
                    <a
                        class="hover:animate-pulse hover:text-blue pl-4 text-lg text-lightgrey"
                        href="/greet/about">
                        about
                    </a>
                    <a
                        class="hover:animate-pulse hover:text-blue pl-4 text-lg text-lightgrey"
                        href="/resume">
                        resume
                    </a>
                </nav>
            </div>
            <Mobile
                animated={animated}
                showPanel={showPanel}
                toggle={toggle}
            />
        </div>
    )
}