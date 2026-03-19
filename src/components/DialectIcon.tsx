import { SiPostgresql } from 'solid-icons/si';
import { SiMysql } from 'solid-icons/si';
import { SiSqlite } from 'solid-icons/si';
import { SiMariadb } from 'solid-icons/si';
import { SiClickhouse } from 'solid-icons/si';
import { FaSolidDatabase } from 'solid-icons/fa';
import { Match, Switch } from 'solid-js';
import type { DialectType } from 'interfaces';

type DialectIconProps = {
  dialect: DialectType;
  class?: string;
};

export const DialectIcon = (props: DialectIconProps) => {
  return (
    <Switch fallback={<FaSolidDatabase class={props.class} />}>
      <Match when={props.dialect === 'Postgresql'}>
        <SiPostgresql class={props.class} />
      </Match>
      <Match when={props.dialect === 'Mysql'}>
        <SiMysql class={props.class} />
      </Match>
      <Match when={props.dialect === 'MariaDB'}>
        <SiMariadb class={props.class} />
      </Match>
      <Match when={props.dialect === 'Sqlite'}>
        <SiSqlite class={props.class} />
      </Match>
      <Match when={props.dialect === 'ClickHouse'}>
        <SiClickhouse class={props.class} />
      </Match>
    </Switch>
  );
};
