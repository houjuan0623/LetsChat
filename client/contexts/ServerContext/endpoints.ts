import type { ExtractKeys, ValueOf } from '../../../definition/utils';
import type { EngagementDashboardEndpoints } from '../../../ee/client/contexts/ServerContext/endpoints/v1/engagementDashboard';
import type { AppsEndpoints } from './endpoints/apps';
import type { ChannelsEndpoints } from './endpoints/v1/channels';
import type { ChatEndpoints } from './endpoints/v1/chat';
import type { CloudEndpoints } from './endpoints/v1/cloud';
import type { CustomUserStatusEndpoints } from './endpoints/v1/customUserStatus';
import type { DmEndpoints } from './endpoints/v1/dm';
import type { DnsEndpoints } from './endpoints/v1/dns';
import type { EmojiCustomEndpoints } from './endpoints/v1/emojiCustom';
import type { GroupsEndpoints } from './endpoints/v1/groups';
import type { ImEndpoints } from './endpoints/v1/im';
import type { LDAPEndpoints } from './endpoints/v1/ldap';
import type { LicensesEndpoints } from './endpoints/v1/licenses';
import type { MiscEndpoints } from './endpoints/v1/misc';
import type { OmnichannelEndpoints } from './endpoints/v1/omnichannel';
import type { RoomsEndpoints } from './endpoints/v1/rooms';
import type { StatisticsEndpoints } from './endpoints/v1/statistics';
import type { TeamsEndpoints } from './endpoints/v1/teams';
import type { UsersEndpoints } from './endpoints/v1/users';

type Endpoints = ChatEndpoints &
	ChannelsEndpoints &
	CloudEndpoints &
	CustomUserStatusEndpoints &
	DmEndpoints &
	DnsEndpoints &
	EmojiCustomEndpoints &
	GroupsEndpoints &
	ImEndpoints &
	LDAPEndpoints &
	RoomsEndpoints &
	TeamsEndpoints &
	UsersEndpoints &
	EngagementDashboardEndpoints &
	AppsEndpoints &
	OmnichannelEndpoints &
	StatisticsEndpoints &
	LicensesEndpoints &
	MiscEndpoints;

type Endpoint = UnionizeEndpoints<Endpoints>;

type UnionizeEndpoints<EE extends Endpoints> = ValueOf<
	{
		[P in keyof EE]: UnionizeMethods<P, EE[P]>;
	}
>;

type ExtractOperations<OO, M extends keyof OO> = ExtractKeys<OO, M, (...args: any[]) => any>;

type UnionizeMethods<P, OO> = ValueOf<
	{
		[M in keyof OO as ExtractOperations<OO, M>]: (
			method: M,
			path: OO extends { path: string } ? OO['path'] : P,
			...params: Parameters<Extract<OO[M], (...args: any[]) => any>>
		) => ReturnType<Extract<OO[M], (...args: any[]) => any>>;
	}
>;

export type Method = Parameters<Endpoint>[0];
export type Path = Parameters<Endpoint>[1];

export type MethodFor<P extends Path> = P extends any
	? Parameters<Extract<Endpoint, (method: any, path: P, ...params: any[]) => any>>[0]
	: never;
export type PathFor<M extends Method> = M extends any
	? Parameters<Extract<Endpoint, (method: M, path: any, ...params: any[]) => any>>[1]
	: never;

type Operation<M extends Method, P extends PathFor<M>> = M extends any
	? P extends any
		? Extract<Endpoint, (method: M, path: P, ...params: any[]) => any>
		: never
	: never;

type ExtractParams<Q> = Q extends [any, any]
	? [undefined?]
	: Q extends [any, any, any, ...any[]]
	? [Q[2]]
	: never;

export type Params<M extends Method, P extends PathFor<M>> = ExtractParams<
	Parameters<Operation<M, P>>
>;
export type Return<M extends Method, P extends PathFor<M>> = ReturnType<Operation<M, P>>;
