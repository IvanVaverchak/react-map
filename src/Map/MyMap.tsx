import { useEffect, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function MapComponent() {
    const [map, setMap] = useState<google.maps.Map>();
    const ref = useRef<HTMLDivElement>(null);
    const [markers, setMarkers] = useState<{
        id: string,
        position: { lat: number, lng: number },
        timestamp: Date,
        marker: google.maps.Marker | null
    }[]>([]);
    const [markerCounter, setMarkerCounter] = useState(1);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

    useEffect(() => {
        if (ref.current && !map) {
            const initialCenter = { lat: 4.4333479181711075, lng: -75.21505129646759 };
            const newMap = new window.google.maps.Map(ref.current, {
                center: initialCenter,
                zoom: 10,
            });
            setMap(newMap);
        }
    }, [map]);

    const handleMarkerClick = (markerId: string) => {
        setSelectedMarkerId(markerId);
    };

    useEffect(() => {
        if (map) {
            const questsRef = collection(db, "quests");
            getDocs(questsRef).then((querySnapshot) => {
                let lastQuestId = 0;
                const markersData: { id: string, position: { lat: number, lng: number }, timestamp: Date, marker: google.maps.Marker | null }[] = [];
                querySnapshot.forEach((doc) => {
                    const questId = parseInt(doc.id.replace("quest", ""));
                    if (questId > lastQuestId) {
                        lastQuestId = questId;
                    }
    
                    const questData = doc.data();
                    const position = questData.location;
                    const timestamp = questData.timestamp.toDate();
                    const icon = {
                        url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=${questId}|FF0000|000000`,
                        labelOrigin: new window.google.maps.Point(11, 50)
                    };
    
                    const marker = new window.google.maps.Marker({
                        position: { lat: position.lat, lng: position.lng },
                        map: map,
                        title: `Marker ${questId} - Timestamp: ${timestamp}`,
                        icon: icon.url,
                    });
    
                    marker.addListener('click', () => {
                        handleMarkerClick(doc.id);
                    });
    
                    markersData.push({ id: doc.id, position: position, timestamp: timestamp, marker: marker });
                });
    
                setMarkers(markersData);
                setMarkerCounter(lastQuestId + 1);
            }).catch((error) => {
                console.error(error);
            });
        }
    }, [map, markers]);

    useEffect(() => {
        if (map) {
            const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
                if (e.latLng && !selectedMarkerId) {
                    const { lat, lng } = e.latLng;

                    const questName = `quest${markerCounter}`;
                    const questRef = doc(db, 'quests', questName);
                    try {
                        await setDoc(questRef, {
                            location: { lat: lat(), lng: lng() },
                            timestamp: new Date()
                        });
                        setMarkerCounter(prevCounter => prevCounter + 1);
                        console.log(markerCounter);
                    } catch (error) {
                        console.error(error);
                    }

                    const icon = {
                        url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=${markerCounter}|FF0000|000000`,
                        labelOrigin: new window.google.maps.Point(11, 50)
                    };

                    new window.google.maps.Marker({
                        position: e.latLng,
                        map: map,
                        title: `Marker ${markerCounter}`,
                        icon: icon,
                    });
                }
            });

            return () => {
                google.maps.event.removeListener(clickListener);
            };
        }
    }, [map, markerCounter, selectedMarkerId]);

    const handleDeleteMarker = () => {
        if (selectedMarkerId) {
            const updatedMarkers = markers.filter(marker => marker.id !== selectedMarkerId);
            setMarkers(updatedMarkers);

            const deletedMarker = markers.find(marker => marker.id === selectedMarkerId);
            if (deletedMarker && deletedMarker.marker) {
                deletedMarker.marker.setMap(null);
            }
    
            const markerDocRef = doc(db, "quests", selectedMarkerId);
            deleteDoc(markerDocRef).then(() => {
                setSelectedMarkerId(null);
                setMarkers(updatedMarkers);
            }).catch(error => {
                console.error(error);

                if (deletedMarker && deletedMarker.marker) {
                    deletedMarker.marker.setMap(map!);
                }
            });
        }
    };

    const deleteAllQuests = () => {
        const batch = writeBatch(db);
        markers.forEach((marker) => {
            const markerDocRef = doc(db, "quests", marker.id);
            batch.delete(markerDocRef);

            if (marker.marker) {
                marker.marker.setMap(null);
            }
        });
    
        batch.commit().then(() => {
            setMarkers([]);
            setSelectedMarkerId(null);
        }).catch(error => {
            console.error(error);
        });
    };

    const moveMarker = (markerId: string, newPosition: { lat: number, lng: number }) => {
        const markerToUpdate = markers.find(marker => marker.id === markerId);
        if (markerToUpdate && markerToUpdate.marker) {
            markerToUpdate.marker.setPosition(newPosition);
            
            const markerDocRef = doc(db, "quests", markerId);
            updateDoc(markerDocRef, { location: newPosition }).then(() => {

                setMarkers(prevMarkers => prevMarkers.map(marker => {
                    if (marker.id === markerId) {
                        return { ...marker, position: newPosition };
                    }
                    return marker;
                }));
            }).catch(error => {
                console.error(error);
                markerToUpdate.marker!.setPosition(markerToUpdate.position);
            });
        }
    };

    useEffect(() => {
        if (map) {
            const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    const { lat, lng } = e.latLng;
                    moveMarker(selectedMarkerId!, { lat: lat(), lng: lng() });
                }
            });
    
            return () => {
                google.maps.event.removeListener(clickListener);
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, selectedMarkerId]);
    

    return (
        <div>
            <div ref={ref} style={{ height: "100%", width: "700px", minHeight: "700px" }} ></div>
            <button onClick={handleDeleteMarker}>Delete quest: {selectedMarkerId}</button>
            <button onClick={deleteAllQuests}>Delete all quests</button>
        </div>
    )
}