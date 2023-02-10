import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import uglify from 'rollup-plugin-uglify';

export default async function ({ watch }) {
    const builds = [];

    // Main
    builds.push({
        plugins: [
            typescript({
                typescript: require('typescript'),
            }),
            resolve({
                mainFields: ['browser'],
            }),
            commonjs(),
            babel({
                exclude: 'node_modules/**',
            }),
            replace({
                exclude: 'node_modules/**',
                ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
            }),
            process.env.NODE_ENV === 'production' && uglify(),
        ],
        input: ['src/index.ts'],
        output: [
            {
                dir: 'build/esm/',
                format: 'esm',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
            {
                dir: 'build/cjs/',
                format: 'cjs',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
        ],
        external:['react']
    });

    // Minified iife
    builds.push({
        input: 'build/esm/index.js',
        plugins: [
            terser({
                compress: { ecma: 2019 },
            }),
        ],
        output: {
            file: 'build/iife/index-min.js',
            format: 'iife',
            name: 'nodeRoomClientReact',
        },
    });

    return builds;
}
