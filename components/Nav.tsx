import { useSignal } from '@preact/signals';
import Hamburger from '../islands/Hamburger.tsx';
import NavPanel from '../islands/NavPanel.tsx';

/** TODO
    active link color change to black (black?)
**/

export default function Nav() {
    const animated = useSignal(false);
    const showPanel = useSignal(false);

    return (
        <div class="box-border font-mono mx-0 my-9">
            <div class="h-12 m-auto max-w-5xl min-w-[230px] w-[86%]">
                <ul class="h-full">
                    <li class="float-left h-full py-1 text-xl">
                        <a
                            class="block hover:animate-pulse hover:text-blue text-2xl sm:text-3xl text-black"
                            href="/">
                            JUSTIN HARRISON
                        </a>
                    </li>
                    <Hamburger
                        animated={animated}
                        showPanel={showPanel}
                    />
                    <li class="float-right h-full hidden sm:block min-w-12 togglable">
                        <a
                            class="block hover:animate-pulse hover:text-blue px-1 py-2 text-lg text-lightgrey"
                            href="/greet/resume">
                            resume
                        </a>
                    </li>
                    <li class="float-right h-full hidden sm:block min-w-12 togglable">
                        <a
                            class="block hover:animate-pulse hover:text-blue px-1 py-2 text-lg text-lightgrey"
                            href="/greet/about">
                            about
                        </a>
                    </li>
                </ul>
            </div>
            <NavPanel
                animated={animated}
                showPanel={showPanel}
            />
        </div>
    )
}