# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.1.0](https://github.com/invm/noir/compare/v2.0.2...v2.1.0) (2025-09-01)


### Features

* add Vim mode support to the SQL editor ([c82c066](https://github.com/invm/noir/commit/c82c06602df6f25b98d80be648b1ff253011891b))

### [2.0.2](https://github.com/invm/noir/compare/v2.0.1...v2.0.2) (2025-09-01)


### Bug Fixes

* bs ([63cef14](https://github.com/invm/noir/commit/63cef143aea1e89616cae538a1c0c55c9f49ddb5))
* json modal ([bc92827](https://github.com/invm/noir/commit/bc928275398e68bfb9bde17cda5594bd58984ca2))
* uuids in psql ([a74741f](https://github.com/invm/noir/commit/a74741fb77e9b0787ca31fa7dbb0ff126b24822d))

### [2.0.1](https://github.com/invm/noir/compare/v2.0.0...v2.0.1) (2025-03-14)


### Bug Fixes

* monaco completion provider ([bf55ce6](https://github.com/invm/noir/commit/bf55ce667412e19700d09289066b31379d9ceb23))
* render nested keys, some ui changes, upgrade sqlparser version ([5bdbf56](https://github.com/invm/noir/commit/5bdbf5602d9a9153d05b1aa4cd2fd6ff02bd1b67))

## [2.0.0](https://github.com/invm/noir/compare/v1.2.0...v2.0.0) (2025-03-02)


### Bug Fixes

* rename error page ([7d82d24](https://github.com/invm/noir/commit/7d82d24314119725465a4e5d7f7d6bd9a3fbd09d))

## [1.2.0](https://github.com/invm/noir/compare/v1.1.5...v1.2.0) (2024-10-12)


### Features

* render tables and views in virutal list ([2ff63a5](https://github.com/invm/noir/commit/2ff63a53019f980e2f21729d32df66d44bdeaa3c))

### [1.1.5](https://github.com/invm/noir/compare/v1.1.4...v1.1.5) (2024-08-28)


### Bug Fixes

* sidebar buttons overflow ([32e7164](https://github.com/invm/noir/commit/32e7164d7b17bdfbc092ea15e405112d44d01ae3))

### [1.1.4](https://github.com/invm/noir/compare/v1.1.3...v1.1.4) (2024-08-02)


### Features

* update logging system to tauri log plugin ([6059a45](https://github.com/invm/noir/commit/6059a453ed913545564ea2b3aa0954d9203ac8f7))


### Bug Fixes

* copy numeric cells ([6f2b4f8](https://github.com/invm/noir/commit/6f2b4f8bfe5f927368720fe93085baf0b82f692f))
* schemas dropdown overflow hidden ([14d57e8](https://github.com/invm/noir/commit/14d57e8ef493be6e4e0ef947b5810e9fa77f3708))

### [1.1.3](https://github.com/invm/noir/compare/v1.1.2...v1.1.3) (2024-07-25)


### Bug Fixes

* missing datatypes in mysql ([7337b32](https://github.com/invm/noir/commit/7337b32477698f41627ae3b35f60241f9d4f6a7a))
* truncate large schema names ([752c2d5](https://github.com/invm/noir/commit/752c2d52fde9b7da6ad08d236e5039773dfb9a2e))

### [1.1.2](https://github.com/invm/noir/compare/v1.1.1...v1.1.2) (2024-07-24)


### Bug Fixes

* unsigned bitint render error and handle schema changes properly ([1d602f1](https://github.com/invm/noir/commit/1d602f13075672a498fea42637186ef315de945f))

### [1.1.1](https://github.com/invm/noir/compare/v1.1.0...v1.1.1) (2024-07-07)


### Features

* add drop table, fix json value in grid ([1e41a7b](https://github.com/invm/noir/commit/1e41a7b2257526f50f7ef738675fdce77fc0fe9d))

## [1.1.0](https://github.com/invm/noir/compare/v1.0.0...v1.1.0) (2024-05-26)


### Features

* add context menu on schemas dropdown, ui changes ([695934b](https://github.com/invm/noir/commit/695934b5282d3ba7b7d4c6f40f515fb00d01f352))
* add query cancellation, remove async process ([0a60dd8](https://github.com/invm/noir/commit/0a60dd83a105907d5214be1f6ad6e73798d88c8c))
* add ssh connection mode with port forwarding ([8c5e5a8](https://github.com/invm/noir/commit/8c5e5a86e31f87afed9918471c4fa1af5c15ba11))
* migrate from rust-simple-mysql to sqlx ([5fcd686](https://github.com/invm/noir/commit/5fcd686ed037f23a64e111c94f09976c7b07a67f))


### Bug Fixes

* minor ui issues ([d657433](https://github.com/invm/noir/commit/d6574333d57f9e5503f573670289b359956a9564))

## [1.0.0](https://github.com/invm/noir/compare/v0.2.0...v1.0.0) (2024-02-28)


### Features

* add support for mariadb ([5772b5b](https://github.com/invm/noir/commit/5772b5b77b84582469306dd8a25fde4ef75e343f))


### Bug Fixes

* editor autocomplete ([19833f0](https://github.com/invm/noir/commit/19833f0b232f5462655e56f3095da8dc2b0b369a))
* missing rerenders when props change ([44ae89c](https://github.com/invm/noir/commit/44ae89ce86a05f234a2265b8895ec28ee2746aa4))
* screens toggle does not toggle back ([500a10e](https://github.com/invm/noir/commit/500a10e17bc2c7cbb40e64aa8f0638aba7ef7d80))

## 0.2.0 (2024-01-27)


### Features

* add ag-grid ([2301afb](https://github.com/invm/noir/commit/2301afbbb4d1cad525702a541e226dfe7226725e))
* add alerts component and global alerts store ([551ccc0](https://github.com/invm/noir/commit/551ccc08c6f975ff042460385d95ccab3e721143))
* add app db migrations ([7294f33](https://github.com/invm/noir/commit/7294f33f6b7ceb9dfbae32713ff9acc94209bfcb))
* add basic mods ([8c0ff7c](https://github.com/invm/noir/commit/8c0ff7cb71cfd2a6694b706921f560847eb788d1))
* add basic opertaions ([e45784a](https://github.com/invm/noir/commit/e45784a1e80fe1873ca6425f248c5f46d1285db9))
* add basic psql tls usage ([f0ff812](https://github.com/invm/noir/commit/f0ff81205ae297cae4151ac47282c4ef6935d3c2))
* add cmd+t and cmd+w shortcuts and add prefer_socket ([6444f90](https://github.com/invm/noir/commit/6444f9032130fb32b2548ac081db7207b1faf49e))
* add codemirror commands ([831bf30](https://github.com/invm/noir/commit/831bf30a3bfce8265e99848fcfb272ec42184349))
* add command palette and style table ([45fb652](https://github.com/invm/noir/commit/45fb652aa3bd1333cdd0d60cef4146697f21ac0a))
* add confirm modal on truncate ([47d23fc](https://github.com/invm/noir/commit/47d23fcff839f8d1a775cc15be497158662fbb12))
* add connection form ui ([94abb5e](https://github.com/invm/noir/commit/94abb5e4ebd7832713f3b3be2309c438e141d5fc))
* add connection handlers, custom errors ([751ce49](https://github.com/invm/noir/commit/751ce494e694bf502b8ede8bc6a1e6d70ec819b2))
* add connection timeout ([d5931a3](https://github.com/invm/noir/commit/d5931a3aafc9b5dbd7babd53eecfec478f6ec40c))
* add context menu on rows ([3f3821a](https://github.com/invm/noir/commit/3f3821a2446f1843cf4e872c6a7e9ee8cf6dd033))
* add context menu, console ui ([473aebf](https://github.com/invm/noir/commit/473aebf40e55b60cb7de92f472cfd0d4db984d73))
* add csv export ([0939d4f](https://github.com/invm/noir/commit/0939d4fe3c1dd08c87d32f487f7a2b28a2b1947f))
* add ctrl-j ctrl-k shortcuts in focused vim mode ([f611e21](https://github.com/invm/noir/commit/f611e215e7cffe3239d8c76c9c9264863fb50622))
* add data query tab, add help page ([4079b46](https://github.com/invm/noir/commit/4079b469daea6bfd13bc70e8db4deaa0d0e6b753))
* add dialect to conn config ([4392043](https://github.com/invm/noir/commit/439204329ddb7ce29f6f00354b71b9186e8e0d05))
* add disconnect function ([b83bbd1](https://github.com/invm/noir/commit/b83bbd1f86205cc5ae46cf1a202bfbe5a57669c8))
* add drawer form ([0a11473](https://github.com/invm/noir/commit/0a1147351a3a68513473f2de3a735fabedcdf82f))
* add editor extensions ([39cfc6e](https://github.com/invm/noir/commit/39cfc6e023afa7e6788b3c99c06853146ea5e4b5))
* add enqueue query method ([c67ce4d](https://github.com/invm/noir/commit/c67ce4dffff22d78d95098e2e6fa20b9d8816382))
* add event bus and refactor command palette ([bcd260d](https://github.com/invm/noir/commit/bcd260d56e31749af0ac62906b8ed4f6a739548e))
* add execute and result sets global shortcuts ([1b29492](https://github.com/invm/noir/commit/1b2949256278bdc170c674e8c94f5153c02ff318))
* add execute query ([fc427ec](https://github.com/invm/noir/commit/fc427ec954cc89c873ebce3547a2223b51509a1a))
* add execute selected text only ([9ddb937](https://github.com/invm/noir/commit/9ddb937fd6a6c30860a3c9d242e9720681592ff4))
* add execute tx ([6631c57](https://github.com/invm/noir/commit/6631c57f2d7fc7fde181d005f5d0dc345fe60852))
* add f1 shortcut ([9c7e24e](https://github.com/invm/noir/commit/9c7e24e33bfa326b2a97c16483849f613067c746))
* add focusable elements, add keyboard shortcuts for query input ([0c425df](https://github.com/invm/noir/commit/0c425df479f9e5cb318ad738ab03451bf8eedb38))
* add get table structure function ([48b9534](https://github.com/invm/noir/commit/48b9534238aaa7ee0e583691993f08a64c03b6e0))
* add get tables and show tables in sidebar ([2708343](https://github.com/invm/noir/commit/2708343beb6fdeb08a69ec41e91f0cbeaf551c6d))
* add i18n and initial screens ([fb8a07c](https://github.com/invm/noir/commit/fb8a07c09c692ad4d0355de9bec9d0b33d5628d6))
* add icons ([a796891](https://github.com/invm/noir/commit/a796891224a3ab663aa45195bc681fbee8105ca9))
* add icons for entities ([d2b1646](https://github.com/invm/noir/commit/d2b164650053b32d66b0e16b738dde57b318db6f))
* add insert and delete row ([92ec634](https://github.com/invm/noir/commit/92ec634bbc6425bac70bba5c863e1f0ee7911f6a))
* add json viewer for row data and search ([46818ac](https://github.com/invm/noir/commit/46818ace880aa76a43cccb1b5f93fdec0b2bda94))
* add keyboard shortcuts ([29189a4](https://github.com/invm/noir/commit/29189a486f2ef967390fdfca7bf2b453b5fcc341))
* add keyboard shortcuts, remove event-bus ([f60fa8d](https://github.com/invm/noir/commit/f60fa8deb69080e6d00a05d5fa3198bb918a87d3))
* add keymaps component ([6dade87](https://github.com/invm/noir/commit/6dade87941908de88dd577bdeace27f31c1db82f))
* add list data and truncate table actions ([6ee5c73](https://github.com/invm/noir/commit/6ee5c732c174daac85ce326b097e6c6a8554b502))
* add loading states ([800ea01](https://github.com/invm/noir/commit/800ea01a766e25866d75f9fa7fd7991e73ebeebe))
* add modal with row data, add row actions ([812aceb](https://github.com/invm/noir/commit/812aceb22bf3dfed4abdab1caf2acc3f83f07c6c))
* add mysql ssl support ([1108bd5](https://github.com/invm/noir/commit/1108bd56c1716cc7fc1abf51de061fb73046c803))
* add open issue link ([7753a0a](https://github.com/invm/noir/commit/7753a0a7ae77883907ceec9827c3f55b3d2f5ef4))
* add panic logs on backend ([4184483](https://github.com/invm/noir/commit/4184483beda54e83f8781f94aef94109ce87ff4e))
* add postgres ssl support ([01317d0](https://github.com/invm/noir/commit/01317d0a1d7362378a08b4197d9d6254b0b2d61e))
* add postgres support ([f5a9db7](https://github.com/invm/noir/commit/f5a9db75dab8d7ded468c73a3bfbb6e855252de1))
* add preserve_order to serde_json ([03d858a](https://github.com/invm/noir/commit/03d858ad2b743b5401b703bd7f10f2d229f279b2))
* add primary key and column type to table ([9631f61](https://github.com/invm/noir/commit/9631f610ea7a2d1bdd37761ed54550f93460bdab))
* add query metadata route ([486788a](https://github.com/invm/noir/commit/486788a4e48cab474bd9333fbcaf7863a48c171b))
* add result sets selection and pagination ([c10376c](https://github.com/invm/noir/commit/c10376ccd4fa7e7a99885a49a120824013862125))
* add routines and triggers ([319ddca](https://github.com/invm/noir/commit/319ddca58ee4319471c5d9df8c75cbca10e188c2))
* add rows action with tooltip ([6d4b1d0](https://github.com/invm/noir/commit/6d4b1d03e82497a91e88a8e1d19b97ad2b08e086))
* add search gui ([7e63a5b](https://github.com/invm/noir/commit/7e63a5bc67aa62082a8a9724e221d62a76a5627e))
* add search in json modal ([fafb473](https://github.com/invm/noir/commit/fafb47328e05a7d6edcabf9fb10b76a62237e3f7))
* add settings page ([25f85f4](https://github.com/invm/noir/commit/25f85f481df5087b082718db97f7da19d06b676b))
* add sqlite support ([51ee5c3](https://github.com/invm/noir/commit/51ee5c32acb917329a12acd0abc371daafe56ad6))
* add sqlparser ([e629346](https://github.com/invm/noir/commit/e629346f51a57f23697d98ccb1ea15d2189132b3))
* add sqlx drivers, add connection struct ([5595118](https://github.com/invm/noir/commit/55951182d98ba46b5be2db69af7eced4bc717798))
* add ssl to psql connect function ([6dd3573](https://github.com/invm/noir/commit/6dd3573e1ca6d0eadc381a6169e8c8a2878dec49))
* add store, log, window state and single instance plugins ([7b2b023](https://github.com/invm/noir/commit/7b2b023c6c4c5fb54338023d9d622cb24e1face2))
* add table data tab ([1d7d070](https://github.com/invm/noir/commit/1d7d070ee3d8bb0648977009a32cd2eeef9f07ba))
* add table struct tab ([f6d1207](https://github.com/invm/noir/commit/f6d1207e4887417345e8102ebce988c3ed33cbf8))
* add tabs and shortcut navigation ([fc1470a](https://github.com/invm/noir/commit/fc1470a512b95d36a5585d7837c4acd738d0db33))
* add tabulator table ([de3ea5d](https://github.com/invm/noir/commit/de3ea5d68ceea6175d8652c1764a38320c9fe6e9))
* add test connection ([c2b4fe2](https://github.com/invm/noir/commit/c2b4fe2a4716b6cca7b0670d797c9a47541d667a))
* add themes and theme switcher ([a307e78](https://github.com/invm/noir/commit/a307e786391c02aa82210d03da04ed84b2a8e52f))
* add themes, csv and json export ([50c73da](https://github.com/invm/noir/commit/50c73da48365de5233d8c48f07c5375796563d76))
* add tooltips, fix minor issues ([d99bc8a](https://github.com/invm/noir/commit/d99bc8a1bef4785bb5ba14024e1ba61651b01cdc))
* add update mechanism ([9856b34](https://github.com/invm/noir/commit/9856b341d7764c16d090d776e8baf5f80efdba88))
* add views ([4019f1b](https://github.com/invm/noir/commit/4019f1b618552a74126d8de04f9ecb14c0050458))
* add vim mode ([a8c0c4c](https://github.com/invm/noir/commit/a8c0c4c4378a08e26afa11dbcaa5f9f032242e48))
* autocomplete columns and tables ([9a64dbf](https://github.com/invm/noir/commit/9a64dbf675953a27602dce63fcd8bdc184ae7b92))
* change connections vector to hashmap and add ping method ([737929c](https://github.com/invm/noir/commit/737929ccfbc3470c4ecb2db46a7fb14f872f3919))
* change id to uuid, fix handlers ([5159ffb](https://github.com/invm/noir/commit/5159ffb8d68701d9246ee4b4ac2d0cbfc7a86498))
* change results to result sets ([33eb122](https://github.com/invm/noir/commit/33eb12222c9d59bd714c4bbc76dadea54a735511))
* change results to result sets, show info message ([f4da449](https://github.com/invm/noir/commit/f4da449b123db4fa0726fa5c8c437c7124427df1))
* finalize state structure ([9545c39](https://github.com/invm/noir/commit/9545c39e6b5435923db7f627373135160eac74b4))
* finish table structure ([9cf248e](https://github.com/invm/noir/commit/9cf248ef5585a5b365b46e122d891dd32ababff3))
* format and save queries state ([c88ad26](https://github.com/invm/noir/commit/c88ad26adc345cead288f9211b5cb88e49c4303f))
* handle execute query result ([8c7d861](https://github.com/invm/noir/commit/8c7d861223d8e583d576e40cc48566f1b61e7b7b))
* handle pagination ([6018493](https://github.com/invm/noir/commit/601849382f8404c27efdc0b6cd63899b150fa99d))
* hash query ([4e67b1f](https://github.com/invm/noir/commit/4e67b1f2a15c12b2ab9655484ffa9d071ba2d2b7))
* init db file ([b598044](https://github.com/invm/noir/commit/b598044715b56e3825994fe31d62d3f25147272b))
* line wrap for json editor and handle null ([e3885f7](https://github.com/invm/noir/commit/e3885f787ea6a3d129eb60827fe0a995d48ff76f))
* load all connections at startup ([0939db7](https://github.com/invm/noir/commit/0939db73d242819e022655271193bf8318ca98c8))
* pass data to frontend ([6c4ca8e](https://github.com/invm/noir/commit/6c4ca8e6e500e2ac947797b6899ffed681cd8112))
* pass dynamic dialect from config to sql parser ([9ef989f](https://github.com/invm/noir/commit/9ef989f84c1edc87003f319fd1100d6ee4a4b6b1))
* refresh connection list after adding connection ([f69a76b](https://github.com/invm/noir/commit/f69a76b4a679b8e4cf52c9b1021323c08f723dcc))
* render connections ([205ea17](https://github.com/invm/noir/commit/205ea1762057dc8bd7a7638877a8bec1bf6088db))
* render results ([7b8cb0a](https://github.com/invm/noir/commit/7b8cb0a77aa75980cc62921a999d01b25a913e5e))
* replace sqlx with mysql client ([246ada7](https://github.com/invm/noir/commit/246ada756990671e71604ca86d5cf17fd1140f35))
* run query and save in file ([a85c87c](https://github.com/invm/noir/commit/a85c87caf46bf468f79dc4fda843bd8633ac89cb))
* save query rows and query metadata ([508bdd5](https://github.com/invm/noir/commit/508bdd5df09ac3cede08041ba8c0768fde81ea91))
* save query tabs to store, move all text to en.json ([8439c05](https://github.com/invm/noir/commit/8439c05bbbef84466d8874c95692f754069aa0d8))
* simple error boundary ([72cd9f5](https://github.com/invm/noir/commit/72cd9f5698b5d5c1a6d323e86d59c2d5d9c3177d))
* solve large data rendering ([1ddb5cc](https://github.com/invm/noir/commit/1ddb5ccdddf836c2064464acb8bc3f0c290a63f6))
* upgrade connection config struct, add tests ([ae92db8](https://github.com/invm/noir/commit/ae92db89d7232e7403aeebe74177fc65e5cf8472))


### Bug Fixes

* app paths and dirs ([1d61a24](https://github.com/invm/noir/commit/1d61a2490555c10bda61746b02cd3036ff2dee7a))
* bs ([901888f](https://github.com/invm/noir/commit/901888ff4d251d13f08d54e4b9b3c56a6822565c))
* change permissions ([426b083](https://github.com/invm/noir/commit/426b0834a5db15f4afc4df7d65570f4e9df33a7d))
* column resize, focus after command palette action, line wrap for editor ([1137b96](https://github.com/invm/noir/commit/1137b96601b7686c912e62929dcfa8d1fa44e6a9))
* contenteditable on webkit bs ([bd9726c](https://github.com/invm/noir/commit/bd9726cc5d043e6b61a8006356094d84399417e7))
* context menus on routines and triggers ([67ac639](https://github.com/invm/noir/commit/67ac639079dd69640c12ab4633edb274a372eec4))
* do not parse null ([7776cec](https://github.com/invm/noir/commit/7776cec20bf97c9244401cca040bc68b5b78d396))
* download whole result set ([1002d88](https://github.com/invm/noir/commit/1002d885b04e89091fe52522430711c3aece43b8))
* handle edge cases in psql types ([1d368a2](https://github.com/invm/noir/commit/1d368a235f515aeba985211ab318f3d0421d6ad1))
* horizontal scroll ([26adc3b](https://github.com/invm/noir/commit/26adc3be5f87e07744f023497c5537ef3720c640))
* keyboard shortcuts ([80b7b7a](https://github.com/invm/noir/commit/80b7b7aca2ed520cd42ea7df37ab02c81113e8b2))
* missing columns after reload ([6ffa37f](https://github.com/invm/noir/commit/6ffa37fe8824dbebd4a5452831a79f5a9570ad37))
* missing mut declaration ([40caf97](https://github.com/invm/noir/commit/40caf97f8c4c5b5f1511661c5eb4fbfc6fcadb78))
* pg types ([01a0429](https://github.com/invm/noir/commit/01a0429a71e4421e291d5a7fd2e2141d521a6511))
* query finish order ([2795c47](https://github.com/invm/noir/commit/2795c474b957552839b7a04d4f651f35ca2c746e))
* results table ui ([8090e0c](https://github.com/invm/noir/commit/8090e0c3e8143c56b50ebfef4d30f345d0533562))
* schema selection ([1474bc1](https://github.com/invm/noir/commit/1474bc106c12a3b92edcbe6645f6aaac048e1544))
* styles ([2d7dc32](https://github.com/invm/noir/commit/2d7dc32ed88eef92685dc376672d0f7241395f3d))
* styles and typos ([d47a216](https://github.com/invm/noir/commit/d47a216f6f4ca922eec07fa6c490e956c0b0b68a))
* table strucre error and error component ([a164128](https://github.com/invm/noir/commit/a164128365382e276d8c1e07c5dae1836a0ab7b5))
* table structure ([3b7560c](https://github.com/invm/noir/commit/3b7560ca12ac9888116d8729c7e2748ae7da26f9))
* table structure tabs does not rerender ([751c980](https://github.com/invm/noir/commit/751c98050e7d89ff76525c6fe2a9fa3ec3712826))
* theme change and connection tabs ([540d8f5](https://github.com/invm/noir/commit/540d8f5abbdd540bb1809e7afc27fd35d8fde9e3))
* updater endpoint ([25e2549](https://github.com/invm/noir/commit/25e25498fdc842baca8abc8122ac35a8508d8be6))

## 0.1.0 (2024-01-13)


### Features

* add ag-grid ([c2e01a1](https://github.com/invm/noir/commit/c2e01a1f81551105c5c8d2d2b31b9c8944b944d0))
* add alerts component and global alerts store ([d994898](https://github.com/invm/noir/commit/d994898b60dde880cbaf51625e76c9ee1779c041))
* add basic mods ([8c0ff7c](https://github.com/invm/noir/commit/8c0ff7cb71cfd2a6694b706921f560847eb788d1))
* add basic opertaions ([e45784a](https://github.com/invm/noir/commit/e45784a1e80fe1873ca6425f248c5f46d1285db9))
* add cmd+t and cmd+w shortcuts and add prefer_socket ([f2454c0](https://github.com/invm/noir/commit/f2454c0314a36fd614a75457b194cb08e1287211))
* add codemirror commands ([7e5b7bc](https://github.com/invm/noir/commit/7e5b7bc721cda4ba44ce972d123105218255e124))
* add command palette and style table ([b72a586](https://github.com/invm/noir/commit/b72a5863cc380cf39bf2e48f79a73bcb9d17ea73))
* add confirm modal on truncate ([26d4c46](https://github.com/invm/noir/commit/26d4c4638dd3cd9f842ac8cd6815eab8a84ef028))
* add connection form ui ([c8a5fc4](https://github.com/invm/noir/commit/c8a5fc4bb4f76d29a034ed194b9885f47355170e))
* add connection handlers, custom errors ([751ce49](https://github.com/invm/noir/commit/751ce494e694bf502b8ede8bc6a1e6d70ec819b2))
* add connection timeout ([a4fcea7](https://github.com/invm/noir/commit/a4fcea7492136b3aed9be66b811f648caa253aff))
* add context menu on rows ([b663cac](https://github.com/invm/noir/commit/b663cacbc4c56f910b0c763f26cc42016ca8d829))
* add context menu, console ui ([75d3706](https://github.com/invm/noir/commit/75d37067472dc9da1e61082886e6d74a9f1224d7))
* add csv export ([2dd4ec6](https://github.com/invm/noir/commit/2dd4ec626ea0d4b6954a3ab9c2147e6abe310b05))
* add ctrl-j ctrl-k shortcuts in focused vim mode ([e3cfc05](https://github.com/invm/noir/commit/e3cfc05d725084fe563161415d5341fb6f749699))
* add data query tab, add help page ([6da8647](https://github.com/invm/noir/commit/6da8647045abcbbdeb4369ad81c8e61a4f9bee14))
* add dialect to conn config ([9baa9e2](https://github.com/invm/noir/commit/9baa9e29dacc778b4a1593bd09460d1eb416910b))
* add disconnect function ([b073ef8](https://github.com/invm/noir/commit/b073ef8c3f414d00e8bf1c27683c12ed4c9d2852))
* add editor extensions ([fe36f40](https://github.com/invm/noir/commit/fe36f40efbf176c385a291d5e8330280ddbfb91d))
* add enqueue query method ([90833cd](https://github.com/invm/noir/commit/90833cd0cf602d4316ae4d3a137b5fd665ce71bb))
* add event bus and refactor command palette ([fea444b](https://github.com/invm/noir/commit/fea444b10ee7f27f9e8cceca358ad0fb232e9c80))
* add execute and result sets global shortcuts ([b6540fb](https://github.com/invm/noir/commit/b6540fb833267bd3cea8c8ff1713a23673bbaae7))
* add execute query ([e1a2915](https://github.com/invm/noir/commit/e1a2915091c5a02129a33e692d5325bbdb953fe4))
* add execute selected text only ([d1ccd3a](https://github.com/invm/noir/commit/d1ccd3af28bdd2a09c069d687f43748c6d519387))
* add execute tx ([83a0837](https://github.com/invm/noir/commit/83a083787c46681eacb00ce13b08e557946f2e6b))
* add f1 shortcut ([1982550](https://github.com/invm/noir/commit/1982550710a1b5515f53ae1dff86bec73ba05b91))
* add focusable elements, add keyboard shortcuts for query input ([d6d918d](https://github.com/invm/noir/commit/d6d918d7c6a92e8fd892aaf0a8db0fbf9fe67d51))
* add get table structure function ([82fee0d](https://github.com/invm/noir/commit/82fee0dc3fcb3d4706a7efc707246c5101e004da))
* add get tables and show tables in sidebar ([cdfeaf6](https://github.com/invm/noir/commit/cdfeaf66cdce8f8f08f427a1a8913f9854a50989))
* add i18n and initial screens ([fb8a07c](https://github.com/invm/noir/commit/fb8a07c09c692ad4d0355de9bec9d0b33d5628d6))
* add icons ([9858f78](https://github.com/invm/noir/commit/9858f780f0a0048b67e4d4a4775a3fd218f51734))
* add icons for entities ([134db87](https://github.com/invm/noir/commit/134db8717964df18f4c35fa02e52040a09cd337a))
* add json viewer for row data and search ([92974c1](https://github.com/invm/noir/commit/92974c1151abdb19cef3832b4e26a7d0ca24eaa7))
* add keyboard shortcuts ([c18350e](https://github.com/invm/noir/commit/c18350e23b388f34ff29e428499911236d988fff))
* add keyboard shortcuts, remove event-bus ([0f47831](https://github.com/invm/noir/commit/0f47831c60754ce749f1e34c8cb9fc7cdb69b4b0))
* add keymaps component ([4761a78](https://github.com/invm/noir/commit/4761a782d7b518fd00614b844b55b0aff84984ad))
* add list data and truncate table actions ([4984155](https://github.com/invm/noir/commit/498415593752708fdbf4d6d2b20c850dc1de0309))
* add loading states ([a5d67b2](https://github.com/invm/noir/commit/a5d67b23b65ef127d127c2afd02638bfed4c7fd0))
* add modal with row data, add row actions ([4b298c4](https://github.com/invm/noir/commit/4b298c4a88ec2d61b05db07ea527d0e832610fe3))
* add open issue link ([f000b90](https://github.com/invm/noir/commit/f000b90be84e5497760ab32e5e67e8bfaf3927ed))
* add panic logs on backend ([3e49520](https://github.com/invm/noir/commit/3e49520c667698120a3dc9de448fe8e06b11ad4a))
* add postgres support ([a85d758](https://github.com/invm/noir/commit/a85d7586ca20654c962393b6c04cde34fe540390))
* add preserve_order to serde_json ([ff49bac](https://github.com/invm/noir/commit/ff49bac9d9aab3c9b6299c93138c1bbee2cbe192))
* add primary key and column type to table ([a9663da](https://github.com/invm/noir/commit/a9663da2ddaf6e67e4771862d917308f446870fb))
* add query metadata route ([e6c4c2f](https://github.com/invm/noir/commit/e6c4c2f518abf5176d3e2c1a5e7199928ae3209d))
* add result sets selection and pagination ([9416798](https://github.com/invm/noir/commit/941679835b2a7612b6f277b66a50004708b1094e))
* add routines and triggers ([bab4f3a](https://github.com/invm/noir/commit/bab4f3aa0c9653bd68ac7b3775fadf012a999ab5))
* add rows action with tooltip ([1d2a030](https://github.com/invm/noir/commit/1d2a030b0606dda56b116ca4d7c9c83116842bdc))
* add search in json modal ([3abfbb7](https://github.com/invm/noir/commit/3abfbb73567bb86f1d11a055759515a663936d40))
* add settings page ([3312876](https://github.com/invm/noir/commit/331287652d491fb80fd5ce2161e6fb4730f17daf))
* add sqlparser ([56e2efb](https://github.com/invm/noir/commit/56e2efb19e5339c5c73aee4330fc9a7a5041749b))
* add sqlx drivers, add connection struct ([813cf67](https://github.com/invm/noir/commit/813cf67a0259366db7f978d364daafc3257b546f))
* add store, log, window state and single instance plugins ([4a873ea](https://github.com/invm/noir/commit/4a873ea5fe9c8c8051f7da32aa11c38cd573147b))
* add table data tab ([35d7683](https://github.com/invm/noir/commit/35d768374f97f90465a78b9770fc75fc3923503c))
* add table struct tab ([a89d57e](https://github.com/invm/noir/commit/a89d57e51c13e2bd40588837baf019934443515d))
* add tabs and shortcut navigation ([d3916a4](https://github.com/invm/noir/commit/d3916a479cccba5a8605a323c9141bad6925ae05))
* add tabulator table ([bf292bb](https://github.com/invm/noir/commit/bf292bb62fbbd58f6bde95eae195b65582a1ea07))
* add test connection ([9511722](https://github.com/invm/noir/commit/951172210b5161c6549fbef5ec771988e0e269d4))
* add themes and theme switcher ([0b80a12](https://github.com/invm/noir/commit/0b80a12284a577c43bf7599029b9c68b9f02feca))
* add themes, csv and json export ([e08b666](https://github.com/invm/noir/commit/e08b66610e8df063aea0eaf7047a39b49cab6c3b))
* add tooltips, fix minor issues ([03be41d](https://github.com/invm/noir/commit/03be41d897cdc737f3cbe7be3fa975beeca806c9))
* add update mechanism ([487db53](https://github.com/invm/noir/commit/487db539c77b687899e075699adbc9f721722c2d))
* add views ([18be5b0](https://github.com/invm/noir/commit/18be5b0c1b70bcb2bfee5ace2761a7fbc6aaac3d))
* add vim mode ([d05ef6a](https://github.com/invm/noir/commit/d05ef6a177fa345444d96f75196639e84202eed5))
* autocomplete columns and tables ([0cb42a5](https://github.com/invm/noir/commit/0cb42a5957930bb79102eb283976f9dc34257496))
* change connections vector to hashmap and add ping method ([f3a72cf](https://github.com/invm/noir/commit/f3a72cf4fa9b38e60ac180c0d425fe7fa793a8ca))
* change id to uuid, fix handlers ([ba07739](https://github.com/invm/noir/commit/ba07739f77854b23f3694bf972c7ddb9d590cc17))
* change results to result sets ([537f44e](https://github.com/invm/noir/commit/537f44ecb473ea1e6a07b78fd2195bf6571ab1fe))
* change results to result sets, show info message ([70238e9](https://github.com/invm/noir/commit/70238e99dee4496df2ee83084329d3c31e2812dd))
* finalize state structure ([227faa3](https://github.com/invm/noir/commit/227faa3de010fa38e8ae7d6db5fccc4bb8e38b11))
* finish table structure ([7fbd7fb](https://github.com/invm/noir/commit/7fbd7fbe1af052dadc5d06626c7405bd12ba7fd5))
* format and save queries state ([c06ff53](https://github.com/invm/noir/commit/c06ff53637f0464c878a9c897db9227aa0d33986))
* handle execute query result ([ed74233](https://github.com/invm/noir/commit/ed74233d475dd2f4b2e50e6560d6e9c89340da7c))
* handle pagination ([849ef04](https://github.com/invm/noir/commit/849ef0410822fbfef6b19f1f7713aca61acdfa88))
* hash query ([27c6e55](https://github.com/invm/noir/commit/27c6e55d9ee7504d9f60a45b5905212efd02ed3b))
* init db file ([b598044](https://github.com/invm/noir/commit/b598044715b56e3825994fe31d62d3f25147272b))
* line wrap for json editor and handle null ([f7c1f75](https://github.com/invm/noir/commit/f7c1f752e59066fc343b979669c00358f5803d44))
* pass data to frontend ([a1f07f9](https://github.com/invm/noir/commit/a1f07f96276f91be0b2cf3b2788c65489243a099))
* pass dynamic dialect from config to sql parser ([5f5b4c8](https://github.com/invm/noir/commit/5f5b4c871b0aa26ee484743a9ac2139610607e24))
* refresh connection list after adding connection ([eb6e641](https://github.com/invm/noir/commit/eb6e64133aca5ebc89853dc9bd9f9b56b431799b))
* render connections ([099312c](https://github.com/invm/noir/commit/099312cd706ff702c295cf5604255d504aa66473))
* render results ([b6952a9](https://github.com/invm/noir/commit/b6952a924e84b8915be47278f2c5e8d17a7bd441))
* replace sqlx with mysql client ([686ee55](https://github.com/invm/noir/commit/686ee5574b6fc38e1dade027e69c46a64697fe42))
* run query and save in file ([7eb7d86](https://github.com/invm/noir/commit/7eb7d86604a60f13126d488720eeeeff22b8c087))
* save query rows and query metadata ([7d641ef](https://github.com/invm/noir/commit/7d641eff09f42efacfa1bd7e59154f2915fa894e))
* save query tabs to store, move all text to en.json ([4561d1c](https://github.com/invm/noir/commit/4561d1c2ecf05bc94e202468e9446ce615e842b7))
* simple error boundary ([91fd567](https://github.com/invm/noir/commit/91fd56734209f501864236dd3adae6720a8bd4d1))
* solve large data rendering ([c5bbcfe](https://github.com/invm/noir/commit/c5bbcfeba88dd7002570fe414c000693bfab5759))
* upgrade connection config struct, add tests ([8ab6895](https://github.com/invm/noir/commit/8ab689562839df90e1c38619118382a668584172))


### Bug Fixes

* column resize, focus after command palette action, line wrap for editor ([6b5b92c](https://github.com/invm/noir/commit/6b5b92cc664b2ced7cc6852d8a1459100dbe1e2e))
* contenteditable on webkit bs ([79ebf81](https://github.com/invm/noir/commit/79ebf8161d41da349fb7cf4a4cf93940b7ba64ac))
* context menus on routines and triggers ([8c1cf16](https://github.com/invm/noir/commit/8c1cf160a3969256b59333b43a1e8100d25b36a2))
* do not parse null ([376f968](https://github.com/invm/noir/commit/376f968c05fef8337e1b18efe9d96d296af0beab))
* download whole result set ([e3a58da](https://github.com/invm/noir/commit/e3a58da3c63d2525a128d21aeddd490744faf1f3))
* handle edge cases in psql types ([e47bd27](https://github.com/invm/noir/commit/e47bd272ea897fa94b9d8dd3ea79650e4d0ccedc))
* horizontal scroll ([580fe58](https://github.com/invm/noir/commit/580fe588dd990c3b4cab695c584721cc4cdb5788))
* missing mut declaration ([85cd379](https://github.com/invm/noir/commit/85cd3798667a3c449b057f018270421b38967d21))
* pg types ([d77a94e](https://github.com/invm/noir/commit/d77a94ed58ac8fc37c6d509fd57cc7d00526f783))
* query finish order ([384a39c](https://github.com/invm/noir/commit/384a39c65f297feadfd00f7fc4501f44198c1fb5))
* results table ui ([d6e41e5](https://github.com/invm/noir/commit/d6e41e58384ad4a769852b4835a3f282ee984477))
* schema selection ([cce261f](https://github.com/invm/noir/commit/cce261faebec462b1ea4ae98b2c82a8935fe2e46))
* styles ([98dcd7e](https://github.com/invm/noir/commit/98dcd7ede9c5fa61f207175f66330d82f0538e47))
* styles and typos ([61b13a5](https://github.com/invm/noir/commit/61b13a543bcbe2f79bcfc39152e3122b877be5ab))
* table structure ([656e41a](https://github.com/invm/noir/commit/656e41a0e6d0a5c065ed27f06a980b9db260e853))
* theme change and connection tabs ([2e370c9](https://github.com/invm/noir/commit/2e370c9489ffbdab5675859f7bed0561c2a1eeeb))
