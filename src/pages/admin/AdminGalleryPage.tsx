import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  createGalleryImage,
  deleteGalleryImage,
  getGallery,
  reorderGallery,
  type GalleryImageCreateInput,
} from "@/lib/api";
import { isValidImageSourceInput, normalizeImageReference } from "@/lib/utils";
import { ImageUploadField } from "@/components/ImageUploadField";

const defaultForm: GalleryImageCreateInput = {
  image_url: "",
  alt: "",
  span: "",
  sort_order: 0,
};

const AdminGalleryPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<GalleryImageCreateInput>(defaultForm);

  const { data: images = [] } = useQuery({ queryKey: ["admin", "gallery-items"], queryFn: getGallery });

  const createMutation = useMutation({
    mutationFn: createGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gallery-items"] });
      setForm(defaultForm);
      toast({ title: "Image uploaded" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gallery-items"] });
      toast({ title: "Image removed" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderGallery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gallery-items"] });
    },
    onError: (error) => {
      toast({ title: "Reorder failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    },
  });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const ordered = [...images];
    const [item] = ordered.splice(index, 1);
    ordered.splice(target, 0, item);
    reorderMutation.mutate(ordered.map((image) => image.id));
  };

  const handleCreate = () => {
    if (!isValidImageSourceInput(form.image_url)) {
      toast({
        title: "Invalid image URL",
        description: "Use an absolute URL (https://...) or a public path like /coffee.jpeg",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ ...form, image_url: normalizeImageReference(form.image_url), sort_order: images.length });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload gallery image</CardTitle>
          <CardDescription>Add media to the homepage gallery module.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ImageUploadField
            id="gallery-image-url"
            value={form.image_url}
            onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            placeholder="https://... or upload"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gallery-alt">Alt text</Label>
              <Input
                id="gallery-alt"
                value={form.alt}
                onChange={(event) => setForm((prev) => ({ ...prev, alt: event.target.value }))}
                placeholder="Latte art on wooden table"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-span">Span</Label>
              <Input
                id="gallery-span"
                value={form.span}
                onChange={(event) => setForm((prev) => ({ ...prev, span: event.target.value }))}
                placeholder="col-span-2"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending || !form.image_url.trim()}
          >
            <Plus className="h-4 w-4" />
            Add image
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gallery ordering</CardTitle>
          <CardDescription>Arrange image sequence shown on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {images.length === 0 && <p className="text-sm text-muted-foreground">No gallery images yet.</p>}
          {images.map((image, index) => (
            <div key={image.id} className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{image.alt || "Untitled image"}</p>
                <p className="text-xs text-muted-foreground truncate">{image.image_url}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => move(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => deleteMutation.mutate(image.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGalleryPage;
