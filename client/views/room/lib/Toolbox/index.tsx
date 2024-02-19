import { Box, Option } from '@rocket.chat/fuselage';
import { FC, LazyExoticComponent, ReactNode, MouseEvent, ComponentProps } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import { TranslationKey } from '../../../../contexts/TranslationContext';
import { generator, Events as GeneratorEvents } from './generator';

type ToolboxHook = ({ room }: { room: IRoom }) => ToolboxActionConfig | null;

type ActionRendererProps = Omit<ToolboxActionConfig, 'renderAction' | 'groups' | 'title'> & {
	className: ComponentProps<typeof Box>['className'];
	index: number;
	title: string;
};

export type ActionRenderer = (props: ActionRendererProps) => ReactNode;

type OptionRendererProps = ComponentProps<typeof Option>;

export type OptionRenderer = (props: OptionRendererProps) => ReactNode;

export type ToolboxActionConfig = {
	id: string;
	icon: string;
	title: TranslationKey;
	anonymous?: boolean;
	renderAction?: ActionRenderer;
	full?: true;
	renderOption?: OptionRenderer;
	order?: number;
	groups: Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple' | 'team'>;
	hotkey?: string;
	action?: (e: MouseEvent<HTMLElement>) => void;
	template?: string | FC | LazyExoticComponent<FC<{ rid: string; tabBar: any }>>;
};

export type ToolboxAction = ToolboxHook | ToolboxActionConfig;

const { listen, add: addAction, remove: deleteAction, store: actions } = generator<ToolboxAction>();

export type Events = GeneratorEvents<ToolboxAction>;

export { listen, addAction, deleteAction, actions };
