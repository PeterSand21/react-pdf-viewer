/**
 * A React component to view a PDF document
 *
 * @see https://react-pdf-viewer.dev
 * @license https://react-pdf-viewer.dev/license
 * @copyright 2019-2020 Nguyen Huu Phuoc <me@phuoc.ng>
 */

import React, { ReactElement } from 'react';
import { createStore, Plugin, PluginFunctions, PluginOnDocumentLoad, PluginOnTextLayerRender, RenderViewer, Slot } from '@react-pdf-viewer/core';

import { EMPTY_KEYWORD_REGEXP } from './constants';
import ShowSearchPopover, { ShowSearchPopoverProps } from './ShowSearchPopover';
import ShowSearchPopoverButton from './ShowSearchPopoverButton';
import StoreProps from './StoreProps';
import Tracker from './Tracker';

interface SearchPlugin extends Plugin {
    ShowSearchPopover(props: ShowSearchPopoverProps): ReactElement;
    ShowSearchPopoverButton(): ReactElement;
}

export interface SearchPluginProps {
    // The keyword that will be highlighted in all pages
    keyword?: string | RegExp;
}

const searchPlugin = (props?: SearchPluginProps): SearchPlugin => {
    const store = createStore<StoreProps>({
        renderStatus: new Map<number, PluginOnTextLayerRender>(),
    });

    const ShowSearchPopoverDecorator = (props: ShowSearchPopoverProps) => (
        <ShowSearchPopover {...props} store={store} />
    );

    const ShowSearchPopoverButtonDecorator = () => (
        <ShowSearchPopoverDecorator>
            {(props) => <ShowSearchPopoverButton {...props} />}
        </ShowSearchPopoverDecorator>
    );

    const renderViewer = (props: RenderViewer): Slot => {
        const currentSlot = props.slot;
        if (currentSlot.subSlot) {
            currentSlot.subSlot.children = (
                <>
                {
                    Array(props.doc.numPages).fill(0).map((_, index) => (
                        <Tracker key={index} pageIndex={index} store={store} />
                    ))
                }
                {currentSlot.subSlot.children}
                </>
            );
        }

        return currentSlot;
    };

    return {
        install: (pluginFunctions: PluginFunctions) => {
            store.update('jumpToDestination', pluginFunctions.jumpToDestination);
            store.update('jumpToPage', pluginFunctions.jumpToPage);
            store.update(
                'keyword',
                props
                    ? ((typeof props.keyword === 'string')
                        ? (props.keyword === '' ? EMPTY_KEYWORD_REGEXP : new RegExp(props.keyword))
                        : (props.keyword || EMPTY_KEYWORD_REGEXP))
                    : EMPTY_KEYWORD_REGEXP
            );
        },
        renderViewer,
        // eslint-disable-next-line  @typescript-eslint/no-unused-vars
        uninstall: (props: PluginFunctions) => {
            const renderStatus = store.get('renderStatus');
            if (renderStatus) {
                renderStatus.clear();
            }
        },
        onDocumentLoad: (props: PluginOnDocumentLoad) => {
            store.update('doc', props.doc);
        },
        onTextLayerRender: (props: PluginOnTextLayerRender) => {
            let renderStatus = store.get('renderStatus');
            if (renderStatus) {
                renderStatus = renderStatus.set(props.pageIndex, props);
                store.update('renderStatus', renderStatus);
            }
        },
        ShowSearchPopover: ShowSearchPopoverDecorator,
        ShowSearchPopoverButton: ShowSearchPopoverButtonDecorator,
    };
};

export default searchPlugin;
