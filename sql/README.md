# Database management, migrations and mock data

The SQL files of Grottocenter are divided in 5 categories:

- **prefix 0\_** :arrow_right: files creating the "base" tables & triggers
- **prefix 1\_** :arrow_right: files updating the tables & triggers (by adding / deleting columns for example)
- **prefix 2\_** :arrow_right: files populating (or seeding) the database with fixed values needed in Grottocenter (ex: document types, languages, countries...)
- **prefix 3\_** :arrow_right: files seeding fake data for development only
- **prefix 4\_** :arrow_right: file updating the PostGreSQL auto incrementing sequences

If you need to update something in the database to make your feature working, then be sure to create the appropriate migration file (**prefix 1\_**) nor seeding file (**prefix 2\_**). Eventually, you will also need to update _mock_data.sql_ to provide fake data to the other developers.

# TODO

- Seeding files (2\_) need to be updated (they are not complete)
