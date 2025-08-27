import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Тип для пресета таймера
export type TimerPreset = {
    id: string;
    name: string;
    prep: number;
    work: number;
    rest: number;
    cycles: number;
    sets: number;
    restBetweenSets: number;
    descWork?: string;
    descRest?: string;
    // Поля для синхронизации
    local_id?: string;
    updated_at?: string;
    is_synced?: boolean;
};

type TimerPresetSelectorProps = {
    presets: TimerPreset[];
    activePresetId?: string;
    onSelectPreset: (preset: TimerPreset) => void;
    onSavePreset: (preset: TimerPreset) => void;
    onDeletePreset: (presetId: string) => void;
    onSyncPresets?: () => Promise<void>;
    isSyncing?: boolean;
    currentSettings: Omit<TimerPreset, 'id' | 'name'>;
};

/**
 * Компонент для выбора, сохранения и управления пресетами таймера
 */
const TimerPresetSelector = ({
    presets,
    activePresetId,
    onSelectPreset,
    onSavePreset,
    onDeletePreset,
    onSyncPresets,
    isSyncing = false,
    currentSettings
}: TimerPresetSelectorProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');

    // Открыть модальное окно выбора пресетов
    const openPresetsModal = useCallback(() => {
        setModalVisible(true);
    }, []);

    // Закрыть модальное окно выбора пресетов
    const closePresetsModal = useCallback(() => {
        setModalVisible(false);
    }, []);

    // Открыть модальное окно сохранения пресета
    const openSaveModal = useCallback(() => {
        setNewPresetName('');
        setSaveModalVisible(true);
        closePresetsModal();
    }, [closePresetsModal]);

    // Закрыть модальное окно сохранения пресета
    const closeSaveModal = useCallback(() => {
        setSaveModalVisible(false);
    }, []);

    // Обработка выбора пресета
    const handleSelectPreset = useCallback((preset: TimerPreset) => {
        onSelectPreset(preset);
        closePresetsModal();
    }, [onSelectPreset, closePresetsModal]);

    // Обработка удаления пресета
    const handleDeletePreset = useCallback((presetId: string) => {
        onDeletePreset(presetId);
    }, [onDeletePreset]);

    // Обработка сохранения нового пресета
    const handleSaveNewPreset = useCallback(() => {
        if (newPresetName.trim()) {
            const newPreset: TimerPreset = {
                id: Date.now().toString(),
                name: newPresetName.trim(),
                ...currentSettings
            };
            onSavePreset(newPreset);
            closeSaveModal();
        }
    }, [newPresetName, currentSettings, onSavePreset, closeSaveModal]);

    // Рендеринг элемента списка пресетов
    const renderPresetItem = useCallback(({ item }: { item: TimerPreset }) => {
        const isActive = item.id === activePresetId;

        return (
            <TouchableOpacity
                style={[
                    styles.presetItem,
                    isActive && styles.activePresetItem
                ]}
                onPress={() => handleSelectPreset(item)}
            >
                <View style={styles.presetInfo}>
                    <Text style={[
                        styles.presetName,
                        isActive && styles.activePresetText
                    ]}>
                        {item.name}
                    </Text>
                    <Text style={styles.presetDetails}>
                        {`${item.cycles} цикл(ов) x ${item.sets} сет(ов)`}
                    </Text>
                    <Text style={styles.presetDetails}>
                        {`${item.work}с работы / ${item.rest}с отдыха`}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePreset(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, [activePresetId, handleSelectPreset, handleDeletePreset]);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.presetButton} onPress={openPresetsModal}>
                <Ionicons name="list-outline" size={20} color="#2196f3" />
                <Text style={styles.presetButtonText}>
                    {activePresetId
                        ? `Пресет: ${presets.find(p => p.id === activePresetId)?.name || 'Выбранный'}`
                        : 'Выбрать пресет'}
                </Text>
            </TouchableOpacity>

            {/* Модальное окно выбора пресетов */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePresetsModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Пресеты таймера</Text>
                            <TouchableOpacity onPress={closePresetsModal}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Кнопка синхронизации, если она доступна */}
                        {onSyncPresets && (
                            <View style={styles.syncContainer}>
                                <Text style={styles.syncText}>Синхронизировать с облаком</Text>
                                {isSyncing ? (
                                    <ActivityIndicator size="small" color="#2196f3" />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.syncButton}
                                        onPress={onSyncPresets}
                                    >
                                        <Ionicons name="sync-outline" size={22} color="#2196f3" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {presets.length > 0 ? (
                            <FlatList
                                data={presets}
                                renderItem={renderPresetItem}
                                keyExtractor={(item) => item.id}
                                style={styles.presetList}
                                contentContainerStyle={{ paddingBottom: 16 }}
                            />
                        ) : (
                            <Text style={styles.emptyText}>
                                У вас нет сохраненных пресетов.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.saveNewButton}
                            onPress={openSaveModal}
                        >
                            <Ionicons name="add-circle-outline" size={22} color="#fff" />
                            <Text style={styles.saveNewButtonText}>Сохранить новый пресет</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Модальное окно сохранения пресета */}
            <Modal
                visible={saveModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeSaveModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.saveModalContent}>
                        <Text style={styles.modalTitle}>Сохранить пресет</Text>

                        <TextInput
                            style={styles.presetNameInput}
                            placeholder="Название пресета"
                            value={newPresetName}
                            onChangeText={setNewPresetName}
                            autoFocus
                        />

                        <View style={styles.saveModalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={closeSaveModal}
                            >
                                <Text style={styles.cancelButtonText}>Отмена</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleSaveNewPreset}
                            >
                                <Text style={styles.confirmButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    presetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e3f2fd',
        alignSelf: 'center',
    },
    presetButtonText: {
        marginLeft: 8,
        color: '#2196f3',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f5f5f5',
    },
    syncText: {
        fontSize: 15,
        color: '#555',
    },
    syncButton: {
        padding: 6,
    },
    presetList: {
        padding: 16,
    },
    presetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    activePresetItem: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#2196f3',
    },
    presetInfo: {
        flex: 1,
    },
    presetName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    activePresetText: {
        color: '#2196f3',
    },
    presetDetails: {
        fontSize: 14,
        color: '#666',
    },
    deleteButton: {
        padding: 8,
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        color: '#666',
    },
    saveNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196f3',
        padding: 16,
    },
    saveNewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    saveModalContent: {
        width: '90%',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    presetNameInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    saveModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelButtonText: {
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#2196f3',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default TimerPresetSelector; 