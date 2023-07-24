# Degree Progression Dashboard

This is a web application dashboard for tracking progression (module progress, assessment grades, upcoming deadlines, etc.) throughout a University degree that I made back in 2022.

While this is primarily developed using [PHP 8.1](https://www.php.net/), it is **not** a server-side rendered website *(excluding the registration script mentioned below)*. The server-side functionality acts as a secure RESTful API for accessing persistent data stored within a [relational MySQL database](https://www.mysql.com/), such as AES encrypted login credentials, course information, results, etc.

The client-side user interface is made using [Bootstrap](https://getbootstrap.com/) and incorporates [Google Charts](https://developers.google.com/chart) to visualise the data and provide interactivity via tooltips. I tried to keep it as responsive as possible to account for mobile/smartphone accessibility, but I will admit some of the charts are a bit skewed depending on the size and orientation of the mobile screen.

The dashboard is protected by an account system that utilises modern security practices such as [TOTP-based two-factor authentication](https://github.com/google/google-authenticator/wiki/Key-Uri-Format). Credit to [Denis Borzenko](https://github.com/bbars) for their [Base32 PHP script](https://github.com/bbars/utils/blob/master/php-base32-encode-decode/Base32.php) that I used for the TOTP secret generation.

See the [registration PHP script](/scripts/server/register.php) for creating new user accounts. This script is disabled by default, so the lines at the top will need to be temporarily commented/removed to use it.

See the [SQL file](/database.sql) for the required database and table structure. It must be imported before-hand, as the scripts do not create it automatically.

**NOTE: This was formerly deployed publicly to https://degreeprogressiondashboard.cf but it has been down for a long while now as I used up all my credit on the web hosting provider.**

![Screenshot](/Screenshot.png)

## Sources

* https://getbootstrap.com/docs/5.0/
* https://api.jquery.com/
* https://stackoverflow.com/a/21403360
* https://stackoverflow.com/a/23374725
* https://stackoverflow.com/a/857256
* https://stackoverflow.com/a/27644339
* https://www.w3schools.com/bootstrap5/bootstrap_spinners.php
* https://www.w3schools.com/mysql/mysql_join.asp
* https://www.php.net/manual/en/index.php
* https://www.tutorialspoint.com/how-to-retrieve-a-random-row-or-multiple-random-rows-in-mysql
* https://developers.google.com/chart/interactive/docs
* https://www.w3resource.com/mysql/aggregate-functions-and-grouping/aggregate-functions-and-grouping-sum-with-group-by.php
* https://www.mysqltutorial.org/mysql-interval/
* https://stackoverflow.com/a/38917888
* https://stackoverflow.com/a/56495465
* https://stackoverflow.com/a/31147653
* https://stackoverflow.com/a/10249847
* https://www.w3schools.com/js/default.asp
* https://stackoverflow.com/a/55982414
* https://stackoverflow.com/a/23374725
* https://developers.google.com/chart/infographics/docs/qr_codes
* https://www.fwait.com/how-to-trigger-select-change-event-in-javascript/
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
* https://its.lafayette.edu/policies-draft/strongpasswords/
* https://www.ocpsoft.org/tutorials/regular-expressions/password-regular-expression/

## License

Copyright (C) 2022-2023 [viral32111](https://viral32111.com).

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see https://www.gnu.org/licenses.
