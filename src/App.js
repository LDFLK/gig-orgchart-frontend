import React, { useState, useEffect } from 'react';
import { Route, Routes } from "react-router-dom";
import './index.css';
import Header from "./shared/header/Header";
import TreeView from "./tree/Tree";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { generateSearchQuery } from "./tree/functions/generateSearchQuery";
import { ApiRoutes, getServerUrl } from "./server";

const appTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function App() {
    const [searchKey, setSearchKey] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [loadedEntity, setLoadedEntity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    const app_props = {
        searchKey, setSearchKey,
        searchResults, setSearchResults,
        loadedEntity, setLoadedEntity,
        isLoading, setIsLoading,
        getSearchResults, getEntity
    };

    useEffect(() => {
        getAccessToken();
    }, []);

    async function getAccessToken() {
        const tokenEndpoint = window?.configs?.tokenEndpoint ? window.configs.tokenEndpoint : "/";
        const clientId = window?.configs?.clientId ? window.configs.clientId : "id";;
        const clientSecret = window?.configs?.clientSecret ? window.configs.clientSecret : "secret";;

        try {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get access token');
            }

            const data = await response.json();
            setAccessToken(data.access_token);
        } catch (error) {
            console.error('Error getting access token:', error);
        }
    }

    async function getSearchResults(searchInput) {
        setIsLoading(true);
        if (searchInput.length > 1 && accessToken) {
            let searchUrl = generateSearchQuery(searchInput);
            searchUrl += '&limit=0';

            try {
                const response = await fetch(searchUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Search request failed');
                }

                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Error in getSearchResults:', error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }

    async function getEntity(title, callback) {
        setIsLoading(true);
        if (accessToken) {
            try {
                const response = await fetch(getServerUrl(ApiRoutes.entity) + title, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    const data = await response.json();
                    setLoadedEntity(data);
                    callback();
                } else {
                    setLoadedEntity(null);
                }
            } catch (error) {
                console.error('Error in getEntity:', error);
                setLoadedEntity(null);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }

    return (
        <ThemeProvider theme={appTheme}>
            <div className="App">
                <Routes>
                    <Route element={<Header {...app_props}/>}>
                        <Route index element={<TreeView {...app_props}/>}/>
                    </Route>
                </Routes>
            </div>
        </ThemeProvider>
    );
}

export default App;