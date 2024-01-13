# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.0.1 (2024-01-13) (Initial release)


### Features

* home screen
    * connections form
        * add mysql connection
        * add postgres connection
    * connections list
* header
    * connections tabs
    * theme toggle
        * ui
        * editor
        * grid
    * settings page
* console screen
    * entities sidebar (tables, views, routine, triggers)
        * schema selection
        * quick actions (show process list, refresh schema entities)
        * on entity context menu
            * table / view
                * show table structure
                * show data
                * truncate table
            * trigger / routine
                * show entity
                * show create statement
    * query tab
        * editor
            * execute query
            * format query
            * copy query
            * toggle editor vim mode
            * set auto limit on queries
        * results grid
            * pagination
                * show total rows in the result set
                * paginate result sets
                * paginate rows
                * export to csv
                * export to json array
                * change page size
                * when in edit mode
                    * apply changes
                    * reset changes
            * table
                * show data
                * on context menu 
                    * view in json mode in a modal
                    * copy row
                    * copy cell
    * table structure tab
        * show columns
        * show indices
        * show constraints
        * show triggers
    * data tab
        * table
            * same functions as in the query tab
            * show key on constraint columns
            * edit cell by double click or on context menu
* keyboard shortcuts
    * f1 - show settings page containing keymaps
    * execute query
    * select query tab
    * select connection tab
    * new tab
    * close tab
    * focus on editor input
    * format query
    * select prev/next result set
    * select prev/next page
    
