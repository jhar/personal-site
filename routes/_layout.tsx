import { LayoutProps } from '$fresh/server.ts';
import { Partial } from '$fresh/runtime.ts';
import Nav from '../components/Nav.tsx';

export default function Layout({ Component }: LayoutProps) {
    return (
        <body f-client-nav>
            <Nav />
            <Partial name="main">
                <Component />
            </Partial>
            <div class="footer">Footer</div>
        </body>
    )
}