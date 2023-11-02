import { Options } from "$fresh/plugins/twind.ts";

export default {
  selfURL: import.meta.url,
  theme: {
    colors: {
      blue: '#4874d4',
      lightgrey: '#676767',
      offblack: 'rgb(25, 25, 25)',
      white: 'rgb(255, 255, 255)',
    },
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.618s forwards',
        fadeOut: 'fadeOut 0.618s forwards',
        slideDown: 'slideDown 0.618s forwards',
        slideUp: 'slideUp 0.618s forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { display: 'none', opacity: 0 },
          '100%': { display: 'block', opacity: 1 },
        },
        fadeOut: {
          '0%': { display: 'block', opacity: 1 },
          '100%': { display: 'none', opacity: 0 },
        },
        slideDown: {
          '0%': { transform: 'translate3d(0, 0, 0)'  },
          '100%': { transform: 'translate3d(2%, 38%, 0)' },
        },
        slideUp: {
          '0%': { transform: 'translate3d(-1%, 24%, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
      },
    },
  }
} as Options;
