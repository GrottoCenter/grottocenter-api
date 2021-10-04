# Database management, migrations and mock data

The SQL files of Grottocenter are divided in 5 categories: 

* **prefix 0_** :arrow_right: files creating the "base" tables & triggers
* **prefix 1_** :arrow_right: files updating the tables & triggers (by adding / deleting columns for example)
* **prefix 2_** :arrow_right: files populating (or seeding) the database with fixed values needed in Grottocenter (ex: document types, languages, countries...)
* **prefix 3_** :arrow_right: files seeding fake data for development only
* **prefix 4_** :arrow_right: file updating the PostGreSQL auto incrementing sequences

If you need to update something in the database to make your feature working, then be sure to create the appropriate migration file (**prefix  1_**) nor seeding file (**prefix  2_**). Eventually, you will also need to update *mock_data.sql* to provide fake data to the other developers. 

# TODO

* Seeding files (2_) need to be updated (they are not complete)